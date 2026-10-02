"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteInsightAction } from "../actions";

export function DeleteInsightButton({ insightId }: { insightId: string }) {
  const action = deleteInsightAction.bind(null, insightId);
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Delete this insight? Its reviews and connections will also be removed.")) event.preventDefault(); }}><Button variant="danger" size="sm"><Trash2 size={15} />Delete</Button></form>;
}
