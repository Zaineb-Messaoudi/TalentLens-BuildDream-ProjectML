import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Bot, ChevronRight, Command, Menu, Search, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils.jsx";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";

export function AppShell({ nav, shell, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((value) => !value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const flatItems = useMemo(
    () =>
      nav.flatMap((group) =>
        group.items.map((item) => ({
          ...item,
          portal: group.title,
        })),
      ),
    [nav],
  );

  const crumbs = location.pathname.split("/").filter(Boolean);

  return (
    <div className="min-h-screen bg-background text-text">
      <div className="fixed inset-0 bg-mesh-glow opacity-90" />
      <div className="fixed inset-0 bg-hero-grid bg-[size:60px_60px] opacity-[0.06]" />
      <div className="relative flex min-h-screen">
        <AnimatePresence initial={false}>
          {sidebarOpen ? (
            <motion.aside
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              className="fixed inset-y-0 left-0 z-40 hidden w-[290px] border-r border-white/10 bg-surface/80 px-5 py-6 backdrop-blur-xl lg:block"
            >
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                  <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-2 shadow-cyan">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">TalentLens</div>
                    <div className="text-xs uppercase tracking-[0.24em] text-muted">AI HR Intelligence</div>
                  </div>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="rounded-xl p-2 hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-8 space-y-6">
                {nav.map((group) => (
                  <div key={group.title}>
                    <p className="mb-3 text-xs uppercase tracking-[0.28em] text-muted">{group.title}</p>
                    <div className="space-y-2">
                      {group.items.map((item) => (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          className={({ isActive }) =>
                            cn(
                              "flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition",
                              isActive ? "bg-white/10 text-white" : "text-muted hover:bg-white/5 hover:text-text",
                            )
                          }
                        >
                          <span className="flex items-center gap-3">
                            <item.icon className="h-4 w-4" />
                            {item.label}
                          </span>
                          <ChevronRight className="h-4 w-4 opacity-50" />
                        </NavLink>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-[28px] border border-white/10 bg-gradient-to-br from-primary/10 to-accent/10 p-5">
                <Badge tone="cyan">{shell?.sidebar_card?.badge || "AI Copilot"}</Badge>
                <p className="mt-3 text-lg font-semibold">{shell?.sidebar_card?.title || "Market summary ready"}</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {shell?.sidebar_card?.message || "Backend market summary unavailable."}
                </p>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>

        <div className={cn("flex-1 transition-all", sidebarOpen ? "lg:pl-[290px]" : "pl-0")}>
          <header className="sticky top-0 z-30 border-b border-white/10 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
            <div className="flex h-20 items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {!sidebarOpen ? (
                  <button onClick={() => setSidebarOpen(true)} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <Menu className="h-4 w-4" />
                  </button>
                ) : null}
                <button
                  onClick={() => setPaletteOpen(true)}
                  className="hidden items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-muted md:flex"
                >
                  <Search className="h-4 w-4" />
                  {shell?.search_placeholder || "Search views, metrics, segments"}
                  <span className="rounded-lg border border-white/10 px-2 py-1 font-mono text-xs">⌘K</span>
                </button>
              </div>

              <div className="hidden items-center gap-2 lg:flex">
                {crumbs.map((crumb) => (
                  <span key={crumb} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-muted">
                    {crumb.replace(/-/g, " ")}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setNoticeOpen(true)} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <Bell className="h-4 w-4" />
                </button>
                <button onClick={() => setPaletteOpen(true)} className="rounded-2xl border border-white/10 bg-white/5 p-3 md:hidden">
                  <Command className="h-4 w-4" />
                </button>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                  <p className="text-sm font-medium">{shell?.profile?.name || "TalentLens User"}</p>
                  <p className="text-xs text-muted">{shell?.profile?.role || "Platform User"}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="relative z-10 p-4 sm:p-6">{children}</main>
        </div>

        <AnimatePresence>
          {paletteOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-24 backdrop-blur-sm"
              onClick={() => setPaletteOpen(false)}
            >
              <motion.div
                initial={{ y: 18, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 18, opacity: 0 }}
                onClick={(event) => event.stopPropagation()}
                className="w-full max-w-2xl rounded-[30px] border border-white/10 bg-surface/95 p-5 shadow-cyan"
              >
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <Search className="h-4 w-4 text-muted" />
                  <input
                    autoFocus
                    placeholder={shell?.search_placeholder || "Jump to recruiter, candidate, admin, market pulse..."}
                    className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted"
                  />
                </div>
                <div className="mt-4 grid gap-3">
                  {flatItems.map((item) => (
                    <button
                      key={item.href}
                      onClick={() => {
                        navigate(item.href);
                        setPaletteOpen(false);
                      }}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10"
                    >
                      <div>
                        <p className="text-sm font-medium text-text">{item.label}</p>
                        <p className="text-xs text-muted">{item.portal}</p>
                      </div>
                      <item.icon className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {noticeOpen ? (
            <motion.aside
              initial={{ x: 360 }}
              animate={{ x: 0 }}
              exit={{ x: 360 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-white/10 bg-surface/95 p-6 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Notifications</h3>
                <button onClick={() => setNoticeOpen(false)} className="rounded-xl p-2 hover:bg-white/10">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {(shell?.notifications || []).map((item) => (
                  <div key={`${item.title}-${item.timestamp}`} className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-text">{item.title}</p>
                    <p className="mt-2 text-sm text-muted">{item.message}</p>
                    <p className="mt-2 text-xs text-muted">{item.timestamp}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-[28px] border border-white/10 bg-gradient-to-br from-primary/10 to-accent/10 p-5">
                <p className="text-sm font-medium text-text">{shell?.assistant_card?.title || "AI assistant widget"}</p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {shell?.assistant_card?.message || "Backend assistant guidance unavailable."}
                </p>
                <Button className="mt-4 w-full">Open Copilot Brief</Button>
              </div>
            </motion.aside>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
