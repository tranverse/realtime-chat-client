import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Copy,
  Crown,
  Link2,
  LogOut,
  ShieldCheck,
  TriangleAlert,
  UserMinus,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Avatar } from "../../components/ui/Avatar";
import { AvatarUpload } from "../../components/ui/AvatarUpload";
import { Button } from "../../components/ui/Button";
import { FormField } from "../../components/ui/FormField";
import { Modal } from "../../components/ui/Modal";
import { getErrorMessage } from "../../lib/errors";
import type { Conversation, InviteLink, MemberRole } from "../../types/api";
import { useAuth } from "../auth/useAuth";
import { MemberPicker } from "./MemberPicker";
import { conversationApi } from "./conversationApi";
import {
  getConversationName,
  getConversationParticipantsLabel,
} from "./conversationUtils";

export function ConversationDetailsModal({
  conversation,
  open,
  onClose,
}: {
  conversation: Conversation;
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [nameDraft, setName] = useState<string | null>(null);
  const [avatarDraft, setAvatar] = useState<string | null>(null);
  const name = nameDraft ?? conversation.name ?? "";
  const avatar = avatarDraft ?? conversation.avatar ?? "";
  const [invite, setInvite] = useState<InviteLink | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    title: string;
    description: string;
    operation: () => Promise<unknown>;
    success: string;
  } | null>(null);
  const canManage =
    conversation.myRole === "OWNER" || conversation.myRole === "ADMIN";

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["conversation", conversation.id],
      }),
      queryClient.invalidateQueries({ queryKey: ["conversations"] }),
      queryClient.invalidateQueries({
        queryKey: ["join-requests", conversation.id],
      }),
    ]);
  };
  const action = useMutation({
    mutationFn: async (operation: () => Promise<unknown>) => operation(),
    onSuccess: refresh,
    onError: (error) => toast.error(getErrorMessage(error)),
  });
  const requests = useQuery({
    queryKey: ["join-requests", conversation.id],
    queryFn: () => conversationApi.joinRequests(conversation.id),
    enabled: open && canManage && conversation.type === "GROUP",
  });

  function createInvite() {
    action.mutate(async () => {
      const created = await conversationApi.createInvite(
        conversation.id,
        true,
        72,
      );
      setInvite(created);
      toast.success("Invite link created. Use Copy invite to share it.");
    });
  }

  function updateRole(memberId: string, role: MemberRole) {
    setConfirmation({
      title: "Change member role?",
      description:
        role === "ADMIN"
          ? "Admins can manage members and group settings."
          : "This member will lose admin permissions.",
      operation: () =>
        conversationApi.updateRole(conversation.id, memberId, role),
      success: "Member role updated.",
    });
  }

  const activeMembers =
    conversation.members?.filter((member) => member.status === "ACTIVE") ?? [];

  return (
    <>
      <Modal
        open={open && !leaveConfirmOpen && !confirmation}
        onClose={() => {
          if (!action.isPending) onClose();
        }}
        title="Conversation details"
        description="Members, permissions, and invitation settings."
        wide
      >
        <div className="details-stack group-details">
          <section className="details-identity">
            <Avatar
              name={getConversationName(conversation, user?.id)}
              src={avatar || conversation.avatar}
              size="xl"
            />
            <div>
              <h3>{getConversationName(conversation, user?.id)}</h3>
              <p>{getConversationParticipantsLabel(conversation, user?.id)}</p>
              {conversation.type === "GROUP" && (
                <span>{conversation.myRole.toLowerCase()}</span>
              )}
            </div>
          </section>

          {conversation.type === "GROUP" && canManage && (
            <section className="details-section">
              <div className="details-section__heading">
                <div>
                  <h3>Group profile</h3>
                  <p>Keep the name and image recognizable.</p>
                </div>
              </div>
              <div className="space-y-4">
                <AvatarUpload
                  name={name || getConversationName(conversation, user?.id)}
                  value={avatar}
                  onChange={setAvatar}
                  disabled={action.isPending}
                />
                <FormField
                  label="Group name"
                  maxLength={50}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>
              <Button
                size="sm"
                loading={action.isPending}
                onClick={() =>
                  action.mutate(() =>
                    conversationApi
                      .update(conversation.id, { name, avatar })
                      .then((updated) => {
                        queryClient.setQueryData(
                          ["conversation", conversation.id],
                          updated,
                        );
                        toast.success("Group profile saved.");
                        setName(null);
                        setAvatar(null);
                      }),
                  )
                }
              >
                Save group profile
              </Button>
            </section>
          )}

          {conversation.type === "GROUP" && canManage && (
            <section className="details-section">
              <div className="details-section__heading">
                <div>
                  <h3>Invite people</h3>
                  <p>Links expire in 72 hours and require approval.</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  leftIcon={<Link2 size={14} />}
                  onClick={createInvite}
                  disabled={action.isPending}
                >
                  Create link
                </Button>
              </div>
              {invite && (
                <div className="invite-result">
                  <code>{`${window.location.origin}/invite/${invite.code}`}</code>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      void navigator.clipboard
                        .writeText(
                          `${window.location.origin}/invite/${invite.code}`,
                        )
                        .then(() => toast.success("Invite link copied."))
                        .catch(() =>
                          toast.error(
                            "Could not copy. Select and copy the link manually.",
                          ),
                        )
                    }
                  >
                    Copy invite
                    <Copy size={15} />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setConfirmation({
                        title: "Revoke this invite link?",
                        description:
                          "People will no longer be able to use this link.",
                        operation: async () => {
                          await conversationApi.revokeInvite(
                            conversation.id,
                            invite.id,
                          );
                          setInvite(null);
                        },
                        success: "Invite link revoked.",
                      });
                    }}
                    disabled={action.isPending}
                  >
                    Revoke invite
                    <X size={15} />
                  </Button>
                </div>
              )}
              <div className="mt-5 border-t border-slate-100 pt-5">
                <h4 className="mb-1 text-sm font-semibold text-slate-900">
                  Add people directly
                </h4>
                <p className="mb-3 text-xs text-slate-500">
                  Select people first, then confirm with Add members.
                </p>
                {open && (
                  <MemberPicker
                    memberIds={activeMembers.map((member) => member.user.id)}
                    pending={action.isPending}
                    onAdd={(ids, done) =>
                      action.mutate(async () => {
                        await conversationApi.addMembers(conversation.id, ids);
                        toast.success("Group updated successfully.");
                        done();
                      })
                    }
                  />
                )}
              </div>
            </section>
          )}

          <section className="details-section">
            <div className="details-section__heading">
              <div>
                <h3>
                  {conversation.type === "PRIVATE" ? "Participants" : "Members"}
                </h3>
                <p>
                  {conversation.type === "PRIVATE"
                    ? getConversationParticipantsLabel(conversation, user?.id)
                    : `${activeMembers.length} active in this conversation.`}
                </p>
              </div>
            </div>
            <div className="member-list">
              {activeMembers.map((member) => {
                const isMe = member.user.id === user?.id;
                return (
                  <div key={member.id} className="member-row">
                    <Avatar
                      name={member.user.name}
                      src={member.user.avatar}
                      size="sm"
                    />
                    <span>
                      <strong>
                        {member.user.name}
                        {isMe ? " (you)" : ""}
                      </strong>
                      <small>
                        @{member.user.username || member.user.email}
                      </small>
                    </span>
                    <i
                      className={`role-badge role-badge--${member.role.toLowerCase()}`}
                    >
                      {member.role === "OWNER" && <Crown size={11} />}
                      {member.role === "ADMIN" && <ShieldCheck size={11} />}
                      {member.role}
                    </i>
                    {canManage && !isMe && member.role !== "OWNER" && (
                      <div className="member-actions">
                        {conversation.myRole === "OWNER" && (
                          <select
                            disabled={action.isPending}
                            aria-label={`Role for ${member.user.name}`}
                            value={member.role}
                            onChange={(event) =>
                              updateRole(
                                member.user.id,
                                event.target.value as MemberRole,
                              )
                            }
                          >
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        )}
                        {conversation.myRole === "OWNER" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() =>
                              setConfirmation({
                                title: "Transfer ownership?",
                                description: `${member.user.name} will become the owner. You will become an admin and lose owner-only controls.`,
                                operation: () =>
                                  conversationApi.transferOwnership(
                                    conversation.id,
                                    member.user.id,
                                  ),
                                success: "Ownership transferred.",
                              })
                            }
                            disabled={action.isPending}
                          >
                            Transfer ownership
                            <Crown size={14} />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          disabled={
                            action.isPending ||
                            (conversation.myRole === "ADMIN" &&
                              member.role === "ADMIN")
                          }
                          onClick={() =>
                            setConfirmation({
                              title: "Remove this member?",
                              description: `${member.user.name} will lose access to this group.`,
                              operation: () =>
                                conversationApi.removeMember(
                                  conversation.id,
                                  member.user.id,
                                ),
                              success: "Member removed.",
                            })
                          }
                        >
                          Remove member
                          <UserMinus size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {canManage && requests.isError && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
            >
              Join requests could not be loaded.
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void requests.refetch()}
              >
                Try again
              </Button>
            </div>
          )}
          {canManage && requests.isLoading && (
            <p role="status" className="text-sm text-slate-500">
              Loading join requests…
            </p>
          )}
          {canManage && requests.data && requests.data.length > 0 && (
            <section className="details-section">
              <div className="details-section__heading">
                <div>
                  <h3>Join requests</h3>
                  <p>Approve the people you recognize.</p>
                </div>
              </div>
              <div className="request-list">
                {requests.data.map((request) => (
                  <div key={request.id}>
                    <Avatar
                      name={request.requestedBy.name}
                      src={request.requestedBy.avatar}
                      size="sm"
                    />
                    <span>
                      <strong>{request.requestedBy.name}</strong>
                      <small>{request.message || "No message included"}</small>
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      disabled={action.isPending}
                      onClick={() =>
                        action.mutate(async () => {
                          await conversationApi.reviewJoinRequest(
                            conversation.id,
                            request.id,
                            false,
                          );
                          toast.success("Join request rejected.");
                          await requests.refetch();
                        })
                      }
                    >
                      Reject
                      <X size={15} />
                    </Button>
                    <Button
                      size="icon"
                      disabled={action.isPending}
                      onClick={() =>
                        action.mutate(async () => {
                          await conversationApi.reviewJoinRequest(
                            conversation.id,
                            request.id,
                            true,
                          );
                          toast.success("Join request approved.");
                          await requests.refetch();
                        })
                      }
                    >
                      Approve
                      <Check size={15} />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {conversation.type === "GROUP" && conversation.myRole !== "OWNER" && (
            <section className="danger-zone">
              <div>
                <h3>Leave conversation</h3>
                <p>You will stop receiving messages from this group.</p>
              </div>
              <Button
                variant="danger"
                leftIcon={<LogOut size={15} />}
                onClick={() => setLeaveConfirmOpen(true)}
                disabled={action.isPending}
              >
                Leave group
              </Button>
            </section>
          )}
        </div>
      </Modal>
      <Modal
        open={open && leaveConfirmOpen}
        onClose={() => {
          if (!action.isPending) setLeaveConfirmOpen(false);
        }}
        title="Leave this group?"
        description="This action removes you from the conversation."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={action.isPending}
              onClick={() => setLeaveConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={action.isPending}
              leftIcon={<LogOut size={15} />}
              onClick={() =>
                action.mutate(async () => {
                  await conversationApi.leave(conversation.id);
                  toast.success("You left the group.");
                  setLeaveConfirmOpen(false);
                  onClose();
                  navigate("/");
                })
              }
            >
              Leave group
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-950">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
            <TriangleAlert size={20} />
          </span>
          <div>
            <p className="font-semibold">
              You will no longer receive messages from this group.
            </p>
            <p className="mt-1 text-sm leading-6 text-red-700">
              You can only return if a member invites you again.
            </p>
          </div>
        </div>
      </Modal>
      <Modal
        open={open && !!confirmation}
        onClose={() => {
          if (!action.isPending) setConfirmation(null);
        }}
        title={confirmation?.title ?? "Confirm action"}
        description={confirmation?.description}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={action.isPending}
              onClick={() => setConfirmation(null)}
            >
              Cancel
            </Button>
            <Button
              loading={action.isPending}
              onClick={() => {
                if (!confirmation) return;
                const current = confirmation;
                action.mutate(current.operation, {
                  onSuccess: () => {
                    toast.success(current.success);
                    setConfirmation(null);
                  },
                });
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Only confirm if you intend to make this change.
        </p>
      </Modal>
    </>
  );
}
