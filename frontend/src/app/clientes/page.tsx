"use client";

// This page has been merged into the main page (/).
// Redirect to home page.
import { redirect } from 'next/navigation';

export default function ClientesPage() {
    redirect('/');
}
