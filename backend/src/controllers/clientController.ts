import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getAllClients = async (req: Request, res: Response) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};

export const createClient = async (req: Request, res: Response) => {
    try {
        const {
            name,
            cpf,
            contactNumber,
            overdueInstallments,
            address,
            responsible,
            observation,
            fileUrl,
            consultationDate,
        } = req.body;

        const newClient = await prisma.client.create({
            data: {
                name,
                cpf,
                contactNumber,
                overdueInstallments: overdueInstallments ? Number(overdueInstallments) : 0,
                address,
                responsible,
                observation,
                fileUrl,
                consultationDate: consultationDate ? new Date(consultationDate) : null,
            },
        });

        res.status(201).json(newClient);
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
};

export const updateClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Handle date conversion if present
        if (updateData.consultationDate) {
            updateData.consultationDate = new Date(updateData.consultationDate);
        }

        if (updateData.overdueInstallments) {
            updateData.overdueInstallments = Number(updateData.overdueInstallments);
        }

        const updatedClient = await prisma.client.update({
            where: { id: String(id) },
            data: updateData,
        });

        res.status(200).json(updatedClient);
    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
};

export const deleteClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.client.delete({
            where: { id: String(id) },
        });
        res.status(200).json({ message: 'Client deleted successfully' });
    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
};
