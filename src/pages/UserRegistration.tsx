"use client";

/* ---------- Imports ---------- */
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Mail,
  UserPlus,
  Building2,
  Shield,
  Loader2,
  Trash2,
  RefreshCw,
  Search,
  UserCircle2,
  AlertTriangle,
} from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  createStaffUser,
  getAllUsers,
  deleteUserById,
} from "@/services/userService";

/* ---------- Roles & Branch list ---------- */
const ROLE_OPTIONS = [
  { label: "Admin", value: "admin" },
  { label: "DSM", value: "dsm" },
  { label: "Branch Admin", value: "branch_admin" },
  { label: "DSE", value: "dse" },
];

const DEFAULT_BRANCHES = [
  "Patna HQ",
  "Bhagalpur",
  "Banka",
  "Khagaria",
  "Jehanabad",
  "Arwal",
];

/* ---------- Types ---------- */
type CreateUserPayload = {
  username: string;
  password: string;
  name: string;
  email: string;
  role: "admin" | "dsm" | "branch_admin" | "dse";
  branch?: string;
};

type UserRecord = {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: "admin" | "dsm" | "branch_admin" | "dse";
  branch?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

/* ---------- Component ---------- */
export default function UserRegistration() {
  /* ---------- Create Form State ---------- */
  const [form, setForm] = useState<CreateUserPayload>({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "dse",
    branch: "",
  });
  const [branches, setBranches] = useState<string[]>(DEFAULT_BRANCHES);
  const [newBranch, setNewBranch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ---------- Users Table State ---------- */
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [search, setSearch] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);

  /* ---------- Derived ---------- */
  const branchRequired = useMemo(
    () =>
      form.role === "dsm" ||
      form.role === "branch_admin" ||
      form.role === "dse",
    [form.role]
  );

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        (u.branch || "")?.toLowerCase().includes(q)
    );
  }, [users, search]);

  /* ---------- Effects ---------- */
  useEffect(() => {
    loadUsers();
  }, []);

  /* ---------- Handlers ---------- */
  const update = (k: keyof CreateUserPayload, v: any) =>
    setForm((s) => ({ ...s, [k]: v }));

  const addBranch = () => {
    const b = newBranch.trim();
    if (!b) return;
    if (branches.includes(b)) {
      toast({
        title: "Branch exists",
        description: `"${b}" is already in the list.`,
      });
      return;
    }
    setBranches((x) => [...x, b]);
    setForm((s) => ({ ...s, branch: b }));
    setNewBranch("");
    toast({ title: "Branch added", description: `Added "${b}" to branches.` });
  };

  const validate = (): string | null => {
    if (!form.username?.trim()) return "Username is required.";
    if (!form.password?.trim()) return "Password is required.";
    if (!form.name?.trim()) return "Name is required.";
    if (!form.email?.trim() || !/\S+@\S+\.\S+/.test(form.email))
      return "Valid email is required.";
    if (!form.role) return "Role is required.";
    if (branchRequired && !form.branch?.trim())
      return "Branch is required for DSM / Branch Admin / DSE.";
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      toast({
        title: "Fix form errors",
        description: err,
        variant: "destructive",
      });
      return;
    }

    const payload: CreateUserPayload = {
      username: form.username.trim().toLowerCase(),
      password: form.password,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      ...(branchRequired ? { branch: form.branch?.trim() } : {}),
    };

    setSubmitting(true);
    try {
      const res = await createStaffUser(payload);
      toast({
        title: " User created successfully",
        description: `${payload.name} (${payload.role}) has been registered and can now access the system.`,
        duration: 5000,
        className:
          "border-green-500 bg-green-900/90 text-green-100 shadow-xl backdrop-blur-sm",
      });

      setForm({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "dse",
        branch: "",
      });

      await loadUsers();
    } catch (e: any) {
      const msg = e?.message || e?.error || "Failed to register user";
      toast({
        title: "❌ Registration failed",
        description: msg,
        variant: "destructive",
        duration: 7000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsers();
      setUsers(res.data || []); //  TS now knows data is UserRecord[]
    } catch {
      toast({
        title: "Load failed",
        description: "Unable to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced delete confirmation with AlertDialog
  const requestDelete = (row: UserRecord) => {
    // Optional: block self-delete
    const meRaw =
      localStorage.getItem("admin_user") || localStorage.getItem("user");
    if (meRaw) {
      try {
        const me = JSON.parse(meRaw);
        const myId = me?.id || me?._id;
        if (myId && myId === row._id) {
          toast({
            title: "⚠️ Action blocked",
            description:
              "You cannot delete your own account for security reasons.",
            variant: "destructive",
            duration: 5000,
          });
          return;
        }
      } catch {}
    }

    setUserToDelete(row);
    setDeleteDialogOpen(true);
  };

  const performDelete = async () => {
    if (!userToDelete) return;

    setDeletingId(userToDelete._id);
    setDeleteDialogOpen(false);

    // Show loading toast
    const loadingToastId = Date.now().toString();
    toast({
      title: "🔄 Deleting user...",
      description: `Removing ${
        userToDelete.name || userToDelete.username
      } from the system.`,
      duration: 0, // Keep it until we manually dismiss it
    });

    try {
      const res = await deleteUserById(userToDelete._id);

      // Success toast with enhanced styling
      toast({
        title: " User deleted successfully",
        description: `${
          userToDelete.name || userToDelete.username
        } has been permanently removed from the system.`,
        duration: 5000,
        className:
          "border-red-500 bg-red-900/90 text-red-100 shadow-xl backdrop-blur-sm",
      });

      await loadUsers();
    } catch (e: any) {
      // Error toast with action to retry
      toast({
        title: "❌ Delete failed",
        description: e?.message || "Unable to delete user. Please try again.",
        variant: "destructive",
        duration: 8000,
        action: (
          <ToastAction
            altText="Retry"
            onClick={() => performDelete()}
            className="bg-red-600 hover:bg-red-700 text-white border-red-500"
          >
            Retry Delete
          </ToastAction>
        ),
      });
    } finally {
      setDeletingId(null);
      setUserToDelete(null);
    }
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  /* ---------- UI ---------- */
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <UserPlus className="h-8 w-8 text-primary" />
            Register Users
          </h1>
          <p className="text-muted-foreground">
            Add Admin / DSM / Branch Admin / DSE to the Main Admin panel
          </p>
        </div>
        <Badge variant="secondary" className="text-primary">
          Admin Console
        </Badge>
      </div>

      {/* Form Card */}
      <Card className="vikram-card">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Details
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-2">
          {/* Username */}
          <div className="space-y-1">
            <Label>Username</Label>
            <Input
              placeholder="Enter username"
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Enter a secure password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
            />
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input
              placeholder="Enter full name"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label>Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={form.role}
              onValueChange={(v: any) => update("role", v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Branch (conditional) */}
          <div className={`space-y-1 ${branchRequired ? "" : "opacity-60"}`}>
            <Label>
              Branch{" "}
              {branchRequired ? (
                <span className="text-red-500">*</span>
              ) : (
                "(not required for Admin)"
              )}
            </Label>
            <div className="flex gap-2">
              <Select
                value={form.branch || ""}
                onValueChange={(v) => update("branch", v)}
                disabled={!branchRequired}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Add-new-branch inline */}
            <div className="flex gap-2 pt-2">
              <Input
                placeholder="Add new branch name"
                value={newBranch}
                onChange={(e) => setNewBranch(e.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={addBranch}
                disabled={!newBranch.trim()}
              >
                <Building2 className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Submit */}
          <div className="md:col-span-2 pt-2 flex gap-2">
            <Button
              onClick={submit}
              disabled={submitting}
              className="vikram-button"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Register User
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setForm({
                  username: "",
                  password: "",
                  name: "",
                  email: "",
                  role: "dse",
                  branch: "",
                })
              }
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List Card */}
      <Card className="vikram-card">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-5 w-5" />
              Users ({filteredUsers.length})
            </CardTitle>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search name, email, role, branch…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-[260px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={loadUsers}
                disabled={loading}
                title="Refresh"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/60">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-400">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400">
                    Username
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400">Role</th>
                  <th className="text-left py-3 px-4 text-gray-400">Branch</th>
                  <th className="text-left py-3 px-4 text-gray-400">Created</th>
                  <th className="text-right py-3 px-4 text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      <div className="inline-flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Loading users…
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      {search.trim()
                        ? "No users match your search."
                        : "No users found."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u._id}
                      className="border-t border-gray-800 hover:bg-gray-900/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-white font-medium">
                        {u.name}
                      </td>
                      <td className="py-3 px-4 text-gray-200">{u.username}</td>
                      <td className="py-3 px-4 text-gray-300">{u.email}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-800 border border-gray-700 text-gray-200">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {u.branch || "—"}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {fmtDate(u.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => requestDelete(u)}
                          disabled={deletingId === u._id}
                          className="inline-flex items-center gap-2 hover:bg-red-600 transition-colors"
                          title={`Delete ${u.name || u.username}`}
                        >
                          {deletingId === u._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="sm:max-w-md mx-4 p-6 bg-gray-900 border-red-500/50 shadow-2xl backdrop-blur-lg">
          <AlertDialogHeader className="text-center pb-4">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center backdrop-blur-sm">
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
            <AlertDialogTitle className="text-xl font-semibold text-gray-100">
              Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300 space-y-2">
              <p>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-white">
                  {userToDelete?.name || userToDelete?.username}
                </span>
                ?
              </p>
              <div className="bg-red-900/30 border border-red-500/30 p-3 rounded-lg text-sm backdrop-blur-sm">
                <p className="font-medium text-red-300 mb-1">
                  This action cannot be undone:
                </p>
                <ul className="text-red-400 space-y-1">
                  <li>• User will lose access to the system immediately</li>
                  <li>• All user data and permissions will be removed</li>
                  <li>• This action is irreversible</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2 pt-4">
            <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1 bg-gray-800 hover:bg-gray-700 text-gray-200 border-gray-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={performDelete}
              className="w-full sm:w-auto order-1 sm:order-2 bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg border-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
