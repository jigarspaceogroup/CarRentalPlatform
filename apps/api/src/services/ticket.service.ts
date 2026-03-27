import { Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import { AppError } from '../utils/app-error';
import type {
  ListTicketsQuery,
  CreateTicketInput,
  UpdateTicketInput,
} from '../validation/ticket.schema';

function generateTicketReference(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `TK-${datePart}-${random}`;
}

export async function listTickets(filters: ListTicketsQuery) {
  const { page, limit, status, priority, category, assignedTo, search } = filters;
  const skip = (page - 1) * limit;
  const where: Prisma.SupportTicketWhereInput = {};
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;
  if (assignedTo) where.assignedTo = assignedTo;
  if (search) {
    where.OR = [
      { referenceNumber: { contains: search, mode: 'insensitive' } },
      { subject: { contains: search, mode: 'insensitive' } },
      { user: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        assignedStaff: { select: { id: true, fullName: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1,
          select: { id: true, content: true, senderType: true, createdAt: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
  ]);
  const data = tickets.map((t) => ({ ...t, lastMessage: t.messages[0] ?? null, messages: undefined }));
  return { tickets: data, total, page, limit };
}

export async function createTicket(data: CreateTicketInput) {
  const customer = await prisma.user.findFirst({ where: { id: data.customerId, deletedAt: null }, select: { id: true } });
  if (!customer) throw AppError.notFound('Customer not found');
  if (data.bookingId) {
    const booking = await prisma.booking.findFirst({ where: { id: data.bookingId, userId: data.customerId }, select: { id: true } });
    if (!booking) throw AppError.notFound('Booking not found or does not belong to this customer');
  }
  let referenceNumber = generateTicketReference();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.supportTicket.findUnique({ where: { referenceNumber }, select: { id: true } });
    if (!existing) break;
    referenceNumber = generateTicketReference();
    attempts++;
  }
  const ticket = await prisma.$transaction(async (tx) => {
    const newTicket = await tx.supportTicket.create({
      data: { referenceNumber, userId: data.customerId, bookingId: data.bookingId ?? null, category: data.category, subject: data.subject, priority: data.priority, status: 'OPEN' },
    });
    await tx.ticketMessage.create({ data: { ticketId: newTicket.id, senderType: 'customer', content: data.description } });
    return newTicket;
  });
  return prisma.supportTicket.findUnique({
    where: { id: ticket.id },
    include: { user: { select: { id: true, fullName: true, email: true } }, messages: { orderBy: { createdAt: 'asc' } } },
  });
}


export async function getTicketDetail(id: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, fullName: true, email: true, phone: true, profilePhotoUrl: true } },
      booking: { select: { id: true, referenceNumber: true, status: true, totalAmount: true } },
      assignedStaff: { select: { id: true, fullName: true, email: true } },
      messages: { orderBy: { createdAt: 'asc' }, include: { senderStaff: { select: { id: true, fullName: true } } } },
    },
  });
  if (!ticket) throw AppError.notFound('Support ticket not found');
  return ticket;
}

export async function updateTicket(id: string, data: UpdateTicketInput) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id }, select: { id: true, status: true } });
  if (!ticket) throw AppError.notFound('Support ticket not found');
  const updateData: Prisma.SupportTicketUpdateInput = {};
  if (data.status) {
    updateData.status = data.status;
    if (data.status === 'RESOLVED' || data.status === 'CLOSED') updateData.resolvedAt = new Date();
  }
  if (data.priority) updateData.priority = data.priority;
  if (data.assignedToStaffId !== undefined) {
    if (data.assignedToStaffId === null) {
      updateData.assignedStaff = { disconnect: true };
    } else {
      const staff = await prisma.staffMember.findUnique({ where: { id: data.assignedToStaffId }, select: { id: true } });
      if (!staff) throw AppError.notFound('Staff member not found');
      updateData.assignedStaff = { connect: { id: data.assignedToStaffId } };
    }
  }
  return prisma.supportTicket.update({
    where: { id }, data: updateData,
    include: { user: { select: { id: true, fullName: true, email: true } }, assignedStaff: { select: { id: true, fullName: true } } },
  });
}

export async function addMessage(ticketId: string, senderId: string, senderType: 'customer' | 'staff', content: string) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId }, select: { id: true, status: true } });
  if (!ticket) throw AppError.notFound('Support ticket not found');
  if (ticket.status === 'CLOSED') throw AppError.badRequest('Cannot add messages to a closed ticket');
  const message = await prisma.ticketMessage.create({
    data: { ticketId, senderType, senderStaffId: senderType === 'staff' ? senderId : null, content },
    include: { senderStaff: { select: { id: true, fullName: true } } },
  });
  if (senderType === 'staff' && ticket.status === 'OPEN') {
    await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'IN_PROGRESS' } });
  }
  return message;
}

export async function getTicketMetrics() {
  const [totalOpen, totalInProgress, totalResolved, totalClosed, byCategory, avgResponseTime] = await Promise.all([
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
    prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    prisma.supportTicket.groupBy({ by: ['category'], _count: { id: true } }),
    prisma.$queryRaw`
      SELECT AVG(EXTRACT(EPOCH FROM (tm.created_at - st.created_at)) / 3600) as avg_hours
      FROM ticket_messages tm
      INNER JOIN support_tickets st ON st.id = tm.ticket_id
      WHERE tm.sender_type = 'staff'
      AND tm.id = (
        SELECT id FROM ticket_messages
        WHERE ticket_id = tm.ticket_id AND sender_type = 'staff'
        ORDER BY created_at ASC LIMIT 1
      )
    ` as Promise<Array<{ avg_hours: number | null }>>,
  ]);
  const categoryMap: Record<string, number> = {};
  for (const item of byCategory) { categoryMap[item.category] = item._count.id; }
  return {
    byStatus: { OPEN: totalOpen, IN_PROGRESS: totalInProgress, RESOLVED: totalResolved, CLOSED: totalClosed },
    byCategory: categoryMap,
    averageResponseTimeHours: avgResponseTime[0]?.avg_hours ? Math.round(avgResponseTime[0].avg_hours * 100) / 100 : null,
    total: totalOpen + totalInProgress + totalResolved + totalClosed,
  };
}
