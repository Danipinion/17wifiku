"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDate } from "@/lib/format";
import { uploadPaymentProof } from "@/actions/billing";
import { toast } from "sonner";
import {
  Loader2,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import Image from "next/image";

type Invoice = {
  id: number;
  amount: string;
  status: "paid" | "unpaid" | "pending";
  createdAt: Date;
  proofImageUrl: string | null;
};

export function InvoiceList({ invoices }: { invoices: Invoice[] }) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedInvoice) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("proof", file);

    try {
      await uploadPaymentProof(selectedInvoice.id, formData);
      toast.success("Payment proof uploaded successfully!");
      setIsDialogOpen(false);
      setFile(null);
    } catch (error) {
      toast.error("Failed to upload proof. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {invoices.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-2" />
          <p>No invoices found. You are all set!</p>
        </div>
      ) : (
        invoices.map((invoice) => (
          <Card
            key={invoice.id}
            className="border-none shadow-md overflow-hidden animate-in fade-in slide-in-from-bottom-2"
          >
            <CardHeader className="bg-muted/30 pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Invoice #{invoice.id}
                </CardTitle>
                <StatusBadge status={invoice.status} />
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex justify-between items-baseline mb-2">
                <span className="text-2xl font-bold">
                  {formatCurrency(invoice.amount)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(invoice.createdAt)}
                </span>
              </div>
              {invoice.status === "unpaid" && (
                <p className="text-sm text-red-500 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-4 w-4" /> Please pay before the
                  due date.
                </p>
              )}
              {invoice.proofImageUrl && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    Proof Uploaded:
                  </p>
                  <div className="relative h-16 w-16 rounded-md overflow-hidden border">
                    <Image
                      src={invoice.proofImageUrl}
                      alt="Proof"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-muted/10">
              {invoice.status === "unpaid" && (
                <Button
                  className="w-full font-bold"
                  onClick={() => {
                    setSelectedInvoice(invoice);
                    setIsDialogOpen(true);
                  }}
                >
                  Pay Now / Upload Proof
                </Button>
              )}
              {invoice.status === "pending" && (
                <Button variant="secondary" className="w-full" disabled>
                  <Clock className="mr-2 h-4 w-4" /> Verification Pending
                </Button>
              )}
              {invoice.status === "paid" && (
                <Button
                  variant="outline"
                  className="w-full text-green-600 border-green-200 hover:bg-green-50"
                  disabled
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Paid
                </Button>
              )}
            </CardFooter>
          </Card>
        ))
      )}

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Payment Proof</DialogTitle>
            <DialogDescription>
              Transfer{" "}
              {selectedInvoice && formatCurrency(selectedInvoice.amount)} to BCA
              1234567890 (Nionify ISP) and upload the screenshot here.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="proof">Screenshot</Label>
              <Input
                id="proof"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-start">
            <Button
              type="button"
              onClick={handleUpload}
              disabled={isUploading || !file}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload Proof
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") {
    return <Badge className="bg-green-500 hover:bg-green-600">Paid</Badge>;
  }
  if (status === "pending") {
    return (
      <Badge className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950">
        Pending
      </Badge>
    );
  }
  return <Badge variant="destructive">Unpaid</Badge>;
}
