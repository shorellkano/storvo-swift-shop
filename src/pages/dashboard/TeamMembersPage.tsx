import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/hooks/useStore";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Copy,
  Check,
  Trash2,
  Crown,
  Clock,
  ArrowLeft,
  X,
} from "lucide-react";
import {
  ROLE_LABELS,
  ROLE_COLORS,
  INVITABLE_ROLES,
  MAX_TEAM_MEMBERS_PRO,
  type TeamRole,
} from "@/lib/teamPermissions";
import UpgradeModal from "@/components/dashboard/UpgradeModal";

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  role: TeamRole;
  status: string;
  created_at: string;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

const TeamMembersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { store, role, loading, isOwner } = useStore();
  const { isPro, loading: subLoading } = useSubscription(store?.id || null);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("admin");
  const [inviting, setInviting] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  useEffect(() => {
    if (!store?.id) return;
    loadData();
  }, [store?.id]);

  const loadData = async () => {
    setDataLoading(true);
    const [membersRes, invitationsRes] = await Promise.all([
      supabase
        .from("team_members")
        .select("*")
        .eq("store_id", store.id)
        .eq("status", "active")
        .order("created_at", { ascending: false }),
      supabase
        .from("team_invitations")
        .select("*")
        .eq("store_id", store.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
    ]);
    setMembers((membersRes.data || []) as TeamMember[]);
    setInvitations((invitationsRes.data || []) as TeamInvitation[]);
    setDataLoading(false);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !store?.id || !user) return;

    if (!isPro) {
      setShowUpgrade(true);
      return;
    }

    if (members.length >= MAX_TEAM_MEMBERS_PRO) {
      toast.error(`Pro plan supports up to ${MAX_TEAM_MEMBERS_PRO} team members.`);
      return;
    }

    setInviting(true);
    try {
      const { data, error } = await supabase
        .from("team_invitations")
        .insert({
          store_id: store.id,
          invited_by: user.id,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        })
        .select("token")
        .single();

      if (error) throw error;

      const link = `${window.location.origin}/invite/${data.token}`;
      setGeneratedLink(link);
      toast.success("Invitation created successfully.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create invitation.");
    } finally {
      setInviting(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRemoveMember = async (memberId: string) => {
    setRemovingId(memberId);
    try {
      const { error } = await supabase
        .from("team_members")
        .update({ status: "removed" })
        .eq("id", memberId);

      if (error) throw error;
      toast.success("Team member removed.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to remove member.");
    } finally {
      setRemovingId(null);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setCancellingId(invitationId);
    try {
      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "cancelled" })
        .eq("id", invitationId);

      if (error) throw error;
      toast.success("Invitation cancelled.");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel invitation.");
    } finally {
      setCancellingId(null);
    }
  };

  const handleInviteDialogClose = (open: boolean) => {
    setShowInviteDialog(open);
    if (!open) {
      setInviteEmail("");
      setInviteRole("admin");
      setGeneratedLink(null);
      setCopied(false);
    }
  };

  if (loading || subLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DashboardSidebar store={store} role={role} />
        <div className="flex-1 flex flex-col">
          <header className="h-14 flex items-center border-b border-border/60 bg-card px-4 gap-3">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard/settings")}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Settings
            </Button>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium">Team Members</span>
          </header>

          <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Team Members</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage who can access and manage your store.
                </p>
              </div>
              {isOwner && (
                <Button
                  onClick={() => {
                    if (!isPro) { setShowUpgrade(true); return; }
                    setShowInviteDialog(true);
                  }}
                  data-testid="button-invite-member"
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </div>

            {!isPro && (
              <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 flex items-start gap-3">
                <Crown className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Pro plan required</p>
                  <p className="text-sm text-amber-700 dark:text-amber-500 mt-0.5">
                    Upgrade to Pro to invite up to {MAX_TEAM_MEMBERS_PRO} team members.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-amber-300 text-amber-800 hover:bg-amber-100"
                    onClick={() => setShowUpgrade(true)}
                  >
                    <Crown className="mr-2 h-3.5 w-3.5" /> Upgrade to Pro
                  </Button>
                </div>
              </div>
            )}

            {isPro && (
              <div className="mb-4 text-sm text-muted-foreground">
                {members.length} of {MAX_TEAM_MEMBERS_PRO} members
              </div>
            )}

            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Active Members
                </h2>
                <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {store?.name?.[0]?.toUpperCase() || "O"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {user?.email}
                      </p>
                      <p className="text-xs text-muted-foreground">You</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-xs shrink-0 ${ROLE_COLORS["owner"]}`}
                    >
                      {ROLE_LABELS["owner"]}
                    </Badge>
                  </div>

                  {dataLoading ? (
                    <div className="p-4 flex justify-center">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : members.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      No team members yet. Invite someone to get started.
                    </div>
                  ) : (
                    members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 p-4"
                        data-testid={`row-member-${member.id}`}
                      >
                        <div className="h-9 w-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <span className="text-sm font-medium text-muted-foreground">
                            {member.email[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {member.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(member.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${ROLE_COLORS[member.role]}`}
                        >
                          {ROLE_LABELS[member.role]}
                        </Badge>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removingId === member.id}
                            data-testid={`button-remove-member-${member.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </section>

              {isOwner && invitations.length > 0 && (
                <section>
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Pending Invitations
                  </h2>
                  <div className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center gap-3 p-4"
                        data-testid={`row-invitation-${inv.id}`}
                      >
                        <div className="h-9 w-9 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {inv.email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Expires {new Date(inv.expires_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs shrink-0 ${ROLE_COLORS[inv.role]}`}
                        >
                          {ROLE_LABELS[inv.role]}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-muted-foreground/80"
                          onClick={() => copyLink(`${window.location.origin}/invite/${inv.token}`)}
                          title="Copy invite link"
                          data-testid={`button-copy-invite-${inv.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleCancelInvitation(inv.id)}
                          disabled={cancellingId === inv.id}
                          title="Cancel invitation"
                          data-testid={`button-cancel-invite-${inv.id}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </main>
        </div>
      </div>

      <Dialog open={showInviteDialog} onOpenChange={handleInviteDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation link to someone to join your store team.
            </DialogDescription>
          </DialogHeader>

          {!generatedLink ? (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="support@yourbrand.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  data-testid="input-invite-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-role">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as TeamRole)}
                >
                  <SelectTrigger data-testid="select-invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-lg bg-accent p-3 text-sm text-muted-foreground">
                <strong className="text-foreground">{ROLE_LABELS[inviteRole]}</strong>{" "}
                {inviteRole === "admin" && "can manage products, orders, customers, and view analytics."}
                {inviteRole === "customer_support" && "can view and update orders and communicate with customers."}
                {inviteRole === "operations" && "can manage inventory, update order and delivery status."}
                {inviteRole === "developer_support" && "can configure integrations, API keys, and tracking scripts."}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim() || inviting}
                  className="flex-1"
                  data-testid="button-send-invite"
                >
                  {inviting ? "Creating..." : "Create Invite Link"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800 p-4">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 mb-1">
                  Invitation link created
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-500">
                  Copy this link and send it to {inviteEmail}. It expires in 7 days.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="text-xs font-mono"
                  data-testid="input-invite-link"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyLink(generatedLink)}
                  data-testid="button-copy-invite-link"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <Button
                onClick={() => handleInviteDialogClose(false)}
                className="w-full"
              >
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        storeId={store?.id || null}
      />
    </SidebarProvider>
  );
};

export default TeamMembersPage;
