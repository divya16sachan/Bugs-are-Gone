"use client";

import React, { useState, useEffect, useCallback } from "react";
import { servicesApi, UserProfile } from "@/lib/services-api";
import { getAccessToken } from "@/lib/api-client";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserAvatar } from "@/lib/avatar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  UserAdd01Icon,
  RefreshIcon,
  Search01Icon,
  CheckmarkCircle01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  Copy01Icon,
  Mail01Icon,
  Calendar01Icon,
  Key01Icon,
  Login01Icon,
  Logout01Icon,
} from "@hugeicons/core-free-icons";

export function UsersDashboard() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loadingMe, setLoadingMe] = useState(false);

  // Paginated Users List state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const limit = 10;

  // Create User Dialog state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [signupName, setSignupName] = useState("Alex Johnson");
  const [signupEmail, setSignupEmail] = useState(`alex_${Date.now().toString().slice(-4)}@example.com`);
  const [signupPassword, setSignupPassword] = useState("Password123!");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("Password123!");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Login Dialog state (for table action and quick authentication)
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [loginDialogEmail, setLoginDialogEmail] = useState("");
  const [loginDialogPassword, setLoginDialogPassword] = useState("Password123!");
  const [showLoginDialogPassword, setShowLoginDialogPassword] = useState(false);
  const [loginDialogLoading, setLoginDialogLoading] = useState(false);

  // Fetch by ID state
  const [searchId, setSearchId] = useState("");
  const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const openLoginDialog = (email: string) => {
    setLoginDialogEmail(email);
    setLoginDialogPassword("Password123!");
    setIsLoginOpen(true);
  };

  const handleDialogLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginDialogEmail || !loginDialogPassword) {
      toast.error("Please provide email and password");
      return;
    }
    setLoginDialogLoading(true);
    try {
      const res = await servicesApi.login({
        email: loginDialogEmail.trim(),
        password: loginDialogPassword,
      });
      setToken(res.token);
      setCurrentUser(res.user);
      setSearchId(res.user.id);
      setLoginEmail(res.user.email);
      toast.success(`Logged in as ${res.user.email}`);
      setIsLoginOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please verify your password.");
    } finally {
      setLoginDialogLoading(false);
    }
  };


  const fetchUsers = useCallback(async (targetPage = page) => {
    setUsersLoading(true);
    try {
      const res = await servicesApi.getUsers({ page: targetPage, limit });
      setUsers(res.users || []);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages || 1);
      setTotalUsers(res.pagination.total || 0);
    } catch (err: any) {
      console.warn("Failed to fetch users list:", err);
      toast.error(err.message || "Failed to load users");
    } finally {
      setUsersLoading(false);
    }
  }, [page]);

  const fetchMe = async () => {
    setLoadingMe(true);
    try {
      const user = await servicesApi.getMe();
      setCurrentUser(user);
      if (user.email) setLoginEmail(user.email);
      if (user.id) setSearchId(user.id);
      toast.success("Profile fetched successfully");
    } catch (err: any) {
      console.warn("Failed to fetch /users/me:", err);
      setCurrentUser(null);
    } finally {
      setLoadingMe(false);
    }
  };

  useEffect(() => {
    const currentToken = getAccessToken();
    setToken(currentToken);
    if (currentToken) {
      fetchMe();
    }
    fetchUsers(1);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupEmail || !signupPassword || !signupName) {
      toast.error("Please fill in all fields");
      return;
    }
    setSignupLoading(true);
    try {
      const res = await servicesApi.signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
      });
      setToken(res.token);
      setCurrentUser(res.user);
      setSearchId(res.user.id);
      setLoginEmail(res.user.email);
      toast.success(`User created: ${res.user.email}`);
      setIsCreateOpen(false);
      // Reset form
      setSignupEmail(`alex_${Date.now().toString().slice(-4)}@example.com`);
      setSignupPassword("Password123!");
      // Reload users list
      fetchUsers(1);
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up");
    } finally {
      setSignupLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Please provide email and password");
      return;
    }
    setLoginLoading(true);
    try {
      const res = await servicesApi.login({
        email: loginEmail,
        password: loginPassword,
      });
      setToken(res.token);
      setCurrentUser(res.user);
      setSearchId(res.user.id);
      toast.success(`Logged in as ${res.user.email}`);
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSearchById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    try {
      const user = await servicesApi.getUserById(searchId.trim());
      setSearchedUser(user);
      toast.success("User found");
    } catch (err: any) {
      setSearchedUser(null);
      setSearchError(err.message || "User not found or access forbidden");
      toast.error(err.message || "Error searching user");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleLogout = () => {
    servicesApi.logout();
    setToken(null);
    setCurrentUser(null);
    toast.info("Logged out & cleared token");
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard`);
  };

  return (
    <div className="space-y-6">
      {/* Service Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-primary/5 to-transparent border border-blue-500/20 backdrop-blur-xs">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">User Microservice Operations</h2>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
              Port 3001
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            JWT Auth (HS256), PostgreSQL User Records, Paginated Directory & Authorization enforcement.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* LOGIN USER DIALOG */}
          <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
            <DialogTrigger render={
              <Button
                variant="outline"
                className="cursor-pointer gap-2 font-medium border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10"
                onClick={() => {
                  if (!loginDialogEmail && currentUser?.email) {
                    setLoginDialogEmail(currentUser.email);
                  }
                }}
              >
                <HugeiconsIcon icon={Login01Icon} strokeWidth={2} className="size-4" />
                Login
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="size-5" />
                  </span>
                  <div>
                    <DialogTitle>Authenticate / Login User</DialogTitle>
                    <DialogDescription>
                      Sign in with credentials to activate a JWT Bearer token session.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <form onSubmit={handleDialogLogin} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dlg-login-email" className="text-xs font-semibold">Email Address</Label>
                  <Input
                    id="dlg-login-email"
                    type="email"
                    value={loginDialogEmail}
                    onChange={(e) => setLoginDialogEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="h-9 font-medium"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dlg-login-password" className="text-xs font-semibold">Password</Label>
                    <span className="text-[11px] text-muted-foreground">Default: <code className="font-mono text-primary font-semibold">Password123!</code></span>
                  </div>
                  <div className="relative">
                    <Input
                      id="dlg-login-password"
                      type={showLoginDialogPassword ? "text" : "password"}
                      value={loginDialogPassword}
                      onChange={(e) => setLoginDialogPassword(e.target.value)}
                      placeholder="Enter password"
                      className="h-9 pr-9"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginDialogPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md cursor-pointer focus:outline-none"
                      aria-label={showLoginDialogPassword ? "Hide password" : "Show password"}
                    >
                      <HugeiconsIcon
                        icon={showLoginDialogPassword ? ViewOffSlashIcon : ViewIcon}
                        strokeWidth={2}
                        className="size-4"
                      />
                    </button>
                  </div>
                </div>

                <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsLoginOpen(false)}
                    className="cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loginDialogLoading}
                    className="cursor-pointer gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium"
                  >
                    {loginDialogLoading ? (
                      <>
                        <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        <HugeiconsIcon icon={Login01Icon} strokeWidth={2} className="size-4" />
                        Log In & Set Session
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {token ? (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-600 text-white gap-1 py-1 px-2.5">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} strokeWidth={2} className="size-3.5" />
                Authenticated
              </Badge>
            </div>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              No Active Token
            </Badge>
          )}
        </div>
      </div>

      {/* USERS LIST TABLE WITH SHADCN PAGINATION */}
      <Card className="shadow-xs border-border/70 overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">User Directory</CardTitle>
                <Badge variant="secondary" className="font-mono text-xs">
                  {totalUsers} {totalUsers === 1 ? "User" : "Users"}
                </Badge>
                <Badge variant="outline" className="font-mono text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30">
                  GET /api/v1/users
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Real-time user accounts stored in PostgreSQL database with pagination controls.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {/* CREATE USER BUTTON (OPENS DIALOG) */}
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger render={
                  <Button size="sm" className="cursor-pointer gap-2 font-medium h-8 text-xs shadow-xs">
                    <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} className="size-3.5" />
                    Create User
                  </Button>
                } />
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
                        <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} className="size-5" />
                      </span>
                      <div>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Sign up a new user record in PostgreSQL with bcrypt password hashing.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>

                  <form onSubmit={handleSignup} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="dialog-signup-name" className="text-xs font-medium">Full Name</Label>
                      <Input
                        id="dialog-signup-name"
                        value={signupName}
                        onChange={(e) => setSignupName(e.target.value)}
                        placeholder="e.g. Alex Johnson"
                        className="h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="dialog-signup-email" className="text-xs font-medium">Email Address</Label>
                        <button
                          type="button"
                          onClick={() => setSignupEmail(`alex_${Date.now().toString().slice(-4)}@example.com`)}
                          className="text-[11px] text-primary hover:underline cursor-pointer"
                        >
                          Randomize
                        </button>
                      </div>
                      <Input
                        id="dialog-signup-email"
                        type="email"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        placeholder="e.g. user@example.com"
                        className="h-9"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="dialog-signup-pass" className="text-xs font-medium">Password</Label>
                      <div className="relative">
                        <Input
                          id="dialog-signup-pass"
                          type={showSignupPassword ? "text" : "password"}
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          placeholder="Min 6 characters"
                          className="h-9 pr-9"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword((prev) => !prev)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md cursor-pointer focus:outline-none"
                          aria-label={showSignupPassword ? "Hide password" : "Show password"}
                        >
                          <HugeiconsIcon
                            icon={showSignupPassword ? ViewOffSlashIcon : ViewIcon}
                            strokeWidth={2}
                            className="size-4"
                          />
                        </button>
                      </div>
                    </div>

                    <DialogFooter className="pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateOpen(false)}
                        className="cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={signupLoading} className="cursor-pointer gap-2">
                        {signupLoading ? (
                          <>
                            <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4 animate-spin" />
                            Creating User...
                          </>
                        ) : (
                          <>
                            <HugeiconsIcon icon={UserAdd01Icon} strokeWidth={2} className="size-4" />
                            Create User (POST)
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              {/* TOOLTIP-WRAPPED ICON BUTTONS: REFRESH & LOGOUT (ON RIGHT SIDE OF REFRESH) */}
              <TooltipProvider>
                <div className="flex items-center gap-1.5">
                  <Tooltip>
                    <TooltipTrigger render={
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => fetchUsers(page)}
                        disabled={usersLoading}
                        className="size-8 cursor-pointer"
                      >
                        <HugeiconsIcon
                          icon={RefreshIcon}
                          strokeWidth={2}
                          className={`size-3.5 ${usersLoading ? "animate-spin" : ""}`}
                        />
                      </Button>
                    } />
                    <TooltipContent>
                      <p className="text-xs">Refresh users</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger render={
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleLogout}
                        disabled={!token}
                        className="size-8 cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive border-border/70 disabled:opacity-40"
                      >
                        <HugeiconsIcon icon={Logout01Icon} strokeWidth={2} className="size-3.5" />
                      </Button>
                    } />
                    <TooltipContent>
                      <p className="text-xs">{token ? `Logout (${currentUser?.email || "session"})` : "No active session"}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border/60">
                  <TableHead className="w-[280px]">User</TableHead>
                  <TableHead className="w-[260px]">User UUID</TableHead>
                  <TableHead className="w-[120px]">Role</TableHead>
                  <TableHead className="w-[180px]">Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className="size-4 animate-spin" />
                        <span>Loading user directory...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      No users found. Click "Create User" to sign up the first account.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isCurrent = currentUser?.id === u.id;
                    const initial = (u.name || u.email || "U").charAt(0).toUpperCase();
                    return (
                      <TableRow key={u.id} className={isCurrent ? "bg-primary/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8 rounded-full border border-border/60 shrink-0">
                              <AvatarImage src={getUserAvatar(u.id, u.email)} alt={u.name} />
                              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                                {initial}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 font-medium text-xs truncate">
                                <span>{u.name}</span>
                                {isCurrent && (
                                  <Badge variant="default" className="text-[10px] py-0 px-1.5 h-4 bg-emerald-600">
                                    You
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                                <HugeiconsIcon icon={Mail01Icon} strokeWidth={2} className="size-3 text-muted-foreground/70" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            <span className="truncate max-w-[190px]" title={u.id}>{u.id}</span>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="size-6 text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => copyToClipboard(u.id, "User ID")}
                              title="Copy User ID"
                            >
                              <HugeiconsIcon icon={Copy01Icon} strokeWidth={2} className="size-3" />
                            </Button>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="capitalize text-[11px] font-normal">
                            {u.role || "customer"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {u.createdAt ? (
                            <div className="flex items-center gap-1">
                              <HugeiconsIcon icon={Calendar01Icon} strokeWidth={2} className="size-3 text-muted-foreground/70" />
                              <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs cursor-pointer px-2 text-muted-foreground hover:text-foreground"
                              onClick={async () => {
                                setSearchId(u.id);
                                setSearchLoading(true);
                                try {
                                  const user = await servicesApi.getUserById(u.id);
                                  setSearchedUser(user);
                                  setSearchError(null);
                                  toast.success(`Loaded profile for ${u.name}`);
                                } catch {
                                  setSearchedUser(u);
                                  toast.info(`Selected ${u.name}`);
                                } finally {
                                  setSearchLoading(false);
                                }
                              }}
                              title="Inspect user details"
                            >
                              Inspect
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs cursor-pointer px-2.5 gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 font-medium"
                              onClick={() => openLoginDialog(u.email)}
                              title={`Log in as ${u.email}`}
                            >
                              <HugeiconsIcon icon={Login01Icon} strokeWidth={2} className="size-3" />
                              Login
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* SHADCN PAGINATION BAR */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of{" "}
                <span className="font-medium text-foreground">{totalPages}</span> • Total {totalUsers} users
              </p>

              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => fetchUsers(Math.max(1, page - 1))}
                      disabled={page <= 1 || usersLoading}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        isActive={page === p}
                        onClick={() => fetchUsers(p)}
                        disabled={usersLoading}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => fetchUsers(Math.min(totalPages, page + 1))}
                      disabled={page >= totalPages || usersLoading}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* OPERATIONS CARDS: LOGIN & SESSION / INSPECT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* READ / AUTH: Login Operation */}
        <Card className="shadow-xs border-border/70 hover:border-primary/40 transition-colors">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                  <HugeiconsIcon icon={Key01Icon} strokeWidth={2} className="size-4" />
                </span>
                <CardTitle className="text-base font-semibold">Authenticate (Login)</CardTitle>
              </div>
              <Badge variant="secondary" className="font-mono text-[11px] bg-blue-500/10 text-blue-600 dark:text-blue-400">
                POST /api/v1/auth/login
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Verifies credentials against DB and issues signed HS256 JWT Token.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs">Email Address</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="e.g. user@example.com"
                  className="h-9"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="login-pass" className="text-xs">Password</Label>
                <div className="relative">
                  <Input
                    id="login-pass"
                    type={showLoginPassword ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="Enter password"
                    className="h-9 pr-9"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword((prev) => !prev)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md cursor-pointer focus:outline-none"
                    aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  >
                    <HugeiconsIcon
                      icon={showLoginPassword ? ViewOffSlashIcon : ViewIcon}
                      strokeWidth={2}
                      className="size-4"
                    />
                  </button>
                </div>
              </div>
              <Button type="submit" size="sm" disabled={loginLoading} className="w-full cursor-pointer mt-2">
                {loginLoading ? "Authenticating..." : "Execute Login (POST)"}
              </Button>
            </CardContent>
          </form>
        </Card>

        {/* READ: Get Me Profile */}
        <Card className="shadow-xs border-border/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <HugeiconsIcon icon={UserIcon} strokeWidth={2} className="size-4" />
                </span>
                <CardTitle className="text-base font-semibold">Active Session Profile</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-[11px]">
                  GET /api/v1/users/me
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 cursor-pointer"
                  onClick={fetchMe}
                  disabled={loadingMe}
                  title="Refresh profile"
                >
                  <HugeiconsIcon icon={RefreshIcon} strokeWidth={2} className={`size-3.5 ${loadingMe ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>
            <CardDescription className="text-xs">
              Validates Bearer JWT claims and reads current user row from PostgreSQL.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentUser ? (
              <div className="space-y-2.5 p-3 rounded-xl bg-muted/40 border border-border/50 text-xs">
                <div className="flex items-center gap-3 pb-2.5 border-b border-border/40">
                  <Avatar className="size-9 rounded-full border border-border/80 shrink-0 shadow-xs">
                    <AvatarImage src={getUserAvatar(currentUser.id, currentUser.email)} alt={currentUser.name} />
                    <AvatarFallback className="font-semibold text-xs bg-primary/10 text-primary">
                      {(currentUser.name || currentUser.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-foreground truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{currentUser.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0 font-mono">{currentUser.role || "customer"}</Badge>
                </div>

                <div className="flex justify-between items-center pb-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">User ID:</span>
                  <span className="font-mono font-medium truncate max-w-[170px]" title={currentUser.id}>{currentUser.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Session Status:</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                    Authenticated
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-5 text-center rounded-xl bg-muted/20 border border-dashed border-border/60 text-muted-foreground text-xs">
                No active profile session. Log in or create a user to authenticate.
              </div>
            )}

            {token && (
              <div className="mt-3 pt-2.5 border-t border-border/50">
                <Label className="text-[11px] text-muted-foreground">Active Bearer JWT</Label>
                <div className="mt-1 p-2 rounded-lg bg-black/5 dark:bg-black/40 font-mono text-[10px] break-all text-muted-foreground select-all">
                  {token.slice(0, 35)}...{token.slice(-25)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* READ: Get User By ID */}
        <Card className="shadow-xs border-border/70">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                  <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-4" />
                </span>
                <CardTitle className="text-base font-semibold">Read User by ID</CardTitle>
              </div>
              <Badge variant="secondary" className="font-mono text-[11px]">
                GET /api/v1/users/:id
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Protected endpoint with token ownership verification (:id must match token.sub).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleSearchById} className="flex gap-2">
              <Input
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Enter User UUID..."
                className="h-9 font-mono text-xs flex-1"
                required
              />
              <Button type="submit" size="sm" disabled={searchLoading} className="cursor-pointer gap-1.5 shrink-0">
                <HugeiconsIcon icon={Search01Icon} strokeWidth={2} className="size-3.5" />
                {searchLoading ? "Fetching..." : "Fetch"}
              </Button>
            </form>

            {searchedUser && (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-2.5 pb-2 border-b border-emerald-500/10">
                  <Avatar className="size-8 rounded-full border border-emerald-500/30 shrink-0">
                    <AvatarImage src={getUserAvatar(searchedUser.id, searchedUser.email)} alt={searchedUser.name} />
                    <AvatarFallback className="text-xs font-semibold bg-emerald-500/20 text-emerald-700">
                      {(searchedUser.name || searchedUser.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-xs text-foreground truncate">{searchedUser.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{searchedUser.email}</p>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID:</span>
                  <span className="font-mono font-medium truncate max-w-[170px]">{searchedUser.id}</span>
                </div>
              </div>
            )}

            {searchError && (
              <div className="p-2.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {searchError}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
