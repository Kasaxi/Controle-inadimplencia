"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClient = exports.updateClient = exports.createClient = exports.getAllClients = void 0;
const express_1 = require("express");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const getAllClients = async (req, res) => {
    try {
        const clients = await prisma.client.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(clients);
    }
    catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
};
exports.getAllClients = getAllClients;
const createClient = async (req, res) => {
    try {
        const { name, cpf, contactNumber, overdueInstallments, address, responsible, observation, fileUrl, consultationDate, } = req.body;
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
    }
    catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
};
exports.createClient = createClient;
const updateClient = async (req, res) => {
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
            where: { id },
            data: updateData,
        });
        res.status(200).json(updatedClient);
    }
    catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
};
exports.updateClient = updateClient;
const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.client.delete({
            where: { id },
        });
        res.status(200).json({ message: 'Client deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
};
exports.deleteClient = deleteClient;
//# sourceMappingURL=clientController.js.map