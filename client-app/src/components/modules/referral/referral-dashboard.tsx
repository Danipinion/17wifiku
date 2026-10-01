"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Share2, Users, Trophy, Gift } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency, formatDate } from "@/lib/format";

type ReferralData = {
  referralCode: string;
  points: number;
  balance: string;
  referralsSent: {
    id: number;
    status: "pending" | "completed";
    rewardAmount: string;
    createdAt: Date;
    referee: {
      name: string;
      createdAt: Date;
    };
  }[];
};

export function ReferralDashboard({ data }: { data: ReferralData }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true);
    toast.success("Referral code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareToWhatsapp = () => {
    const text = `Join Nionify using my code ${data.referralCode} and get a discount on your first bill! https://nionify.com`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Points
            </CardTitle>
            <Trophy className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.points}</div>
            <p className="text-xs text-muted-foreground">Lifetime earnings</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Balance
            </CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(data.balance)}
            </div>
            <p className="text-xs text-muted-foreground">Available to redeem</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500/10 to-sky-500/10 border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Friends Invited
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.referralsSent.length}
            </div>
            <p className="text-xs text-muted-foreground">People joined</p>
          </CardContent>
        </Card>
      </div>

      {/* Invite Section */}
      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle>Invite & Earn</CardTitle>
          <CardDescription>
            Share your unique code. When friends join and pay their first bill,
            you both earn rewards!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                value={data.referralCode}
                className="font-mono text-center text-lg font-bold tracking-widest bg-muted/50"
              />
            </div>
            <Button onClick={copyToClipboard} size="icon" variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={shareToWhatsapp}
            className="w-full gap-2 font-bold bg-[#25D366] hover:bg-[#128C7E] text-white"
          >
            <Share2 className="h-4 w-4" /> Share on WhatsApp
          </Button>
        </CardContent>
      </Card>

      {/* History Tabs */}
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="friends">Invited Friends</TabsTrigger>
          <TabsTrigger value="rewards">Rewards History</TabsTrigger>
        </TabsList>
        <TabsContent value="friends">
          <Card className="border-none shadow-sm mt-4">
            <CardContent className="pt-6">
              {data.referralsSent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No friends invited yet. Start sharing!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.referralsSent.map((referral) => (
                    <div
                      key={referral.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div>
                        <p className="font-medium">{referral.referee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {formatDate(referral.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-full ${
                            referral.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {referral.status === "completed"
                            ? "Active"
                            : "Pending"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="rewards">
          <Card className="border-none shadow-sm mt-4">
            <CardContent className="pt-6">
              {/* Simple list for now, reusing same data points */}
              {data.referralsSent.filter((r) => parseFloat(r.rewardAmount) > 0)
                .length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Gift className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No rewards earned yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.referralsSent
                    .filter((r) => parseFloat(r.rewardAmount) > 0)
                    .map((referral) => (
                      <div
                        key={referral.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                      >
                        <div>
                          <p className="font-medium">
                            Reward for inviting {referral.referee.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(referral.createdAt)}
                          </p>
                        </div>
                        <div className="font-bold text-green-600">
                          +{formatCurrency(referral.rewardAmount)}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
