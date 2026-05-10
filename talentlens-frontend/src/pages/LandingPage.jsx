import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Play, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../components/ui/Button.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { GlassPanel } from "../components/shared/GlassPanel.jsx";
import { getIconComponent } from "../data/uiConfig.jsx";
import { getFrontendBootstrap, getPlatformOverview } from "../services/talentlensService.jsx";

export function LandingPage() {
  const [overview, setOverview] = useState(null);
  const [bootstrap, setBootstrap] = useState(null);

  useEffect(() => {
    let active = true;
    getPlatformOverview().then((response) => {
      if (!active) return;
      setOverview(response.data);
    });
    getFrontendBootstrap().then((response) => {
      if (!active) return;
      setBootstrap(response.data);
    });
    return () => {
      active = false;
    };
  }, []);

  const heroStats = overview?.hero_stats || [];
  const landingInsights = overview?.landing_insights || [];
  const testimonials = overview?.testimonials || [];
  const salaryTrend = overview?.salary_trend || [];
  const demandForecast = overview?.demand_forecast || [];
  const landingFeatures = bootstrap?.landing_features || [];
  const previewPortals = bootstrap?.preview_portals || [];

  return (
    <div className="min-h-screen overflow-hidden bg-background text-text">
      <div className="fixed inset-0 bg-mesh-glow" />
      <div className="fixed inset-0 bg-hero-grid bg-[size:72px_72px] opacity-[0.08]" />
      <div className="relative z-10">
        <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-primary to-accent p-2">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-semibold">TalentLens</div>
              <div className="text-xs uppercase tracking-[0.28em] text-muted">AI HR Intelligence</div>
            </div>
          </Link>
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/recruiter"><Button variant="ghost">Recruiter</Button></Link>
            <Link to="/candidate"><Button variant="ghost">Candidate</Button></Link>
            <Link to="/admin"><Button>Open Platform</Button></Link>
          </div>
        </header>

        <section className="mx-auto grid min-h-[88vh] max-w-7xl items-center gap-10 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <Badge tone="purple">Cinematic AI-native SaaS for hiring teams</Badge>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 max-w-4xl text-5xl font-semibold leading-[1.02] text-text sm:text-6xl xl:text-7xl"
            >
              AI-Powered HR Intelligence for the{" "}
              <span className="bg-gradient-to-r from-primary via-cyan-200 to-accent bg-clip-text text-transparent">
                Modern Hiring Market
              </span>
            </motion.h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Salary intelligence, offer anomaly detection, candidate fit scoring, and workforce forecasting wrapped in a
              premium enterprise experience that hides the model complexity and surfaces business clarity.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/admin"><Button>Book Investor Demo <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Button variant="secondary"><Play className="mr-2 h-4 w-4" /> Watch Platform Tour</Button>
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-muted">
              {heroStats.slice(0, 3).map((item) => (
                <span key={item.label}>{item.value} {item.label.toLowerCase()}</span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-12 top-10 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute -right-10 top-24 h-48 w-48 rounded-full bg-accent/25 blur-3xl" />
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 6 }} className="relative z-10">
              <GlassPanel className="rotate-[-5deg] p-0">
                <div className="border-b border-white/10 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted">Recruiter Signal Deck</p>
                      <h3 className="mt-2 text-2xl font-semibold">Offer Risk Engine</h3>
                    </div>
                    <Badge tone="red">RED anomaly</Badge>
                  </div>
                </div>
                <div className="grid gap-5 p-5 md:grid-cols-[1fr_0.8fr]">
                  <div className="h-64 rounded-[24px] border border-white/10 bg-white/5 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salaryTrend}>
                        <defs>
                          <linearGradient id="landingArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#7B61FF" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="#7B61FF" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: "#8ea0c3", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#8ea0c3", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: "#101C30", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)" }}
                        />
                        <Area dataKey="salary" stroke="#7B61FF" fill="url(#landingArea)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-muted">Deviation vs market</p>
                      <p className="mt-2 text-4xl font-semibold text-danger">{landingInsights[1]?.metric || "--"}</p>
                    </div>
                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <p className="text-sm text-muted">Suggested correction</p>
                      <p className="mt-2 text-xl text-text">{landingInsights[0]?.metric || "--"}</p>
                    </div>
                    <div className="rounded-[24px] border border-primary/20 bg-primary/10 p-4">
                      <p className="text-sm text-primary">AI insight</p>
                      <p className="mt-2 text-sm leading-6 text-text/90">
                        {landingInsights[2]?.body || "Awaiting backend market insight."}
                      </p>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <Badge tone="cyan">Platform capability map</Badge>
              <h2 className="mt-4 text-4xl font-semibold">A Bento Grid built for real hiring decisions</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted">
              Every module is intentionally designed to feel like a high-conviction product surface rather than a generic admin tile.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {landingFeatures.map((feature, index) => {
              const Icon = getIconComponent(feature.icon_key);
              return (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                <GlassPanel className={`h-full min-h-[220px] bg-gradient-to-br ${feature.tint}`}>
                  <Icon className="h-8 w-8 text-text" />
                  <h3 className="mt-8 text-2xl font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted">
                    {feature.description}
                  </p>
                  <div className="mt-6 text-sm text-primary">{feature.metric}</div>
                </GlassPanel>
              </motion.div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-6 py-20 lg:grid-cols-[1fr_1fr]">
          <GlassPanel className="p-6">
            <Badge tone="purple">Platform Preview</Badge>
            <h2 className="mt-4 text-3xl font-semibold">Three connected product ecosystems</h2>
            <p className="mt-3 text-sm leading-7 text-muted">
              Recruiter workflows, candidate coaching, and executive workforce intelligence share one design language and one source of truth.
            </p>
            <div className="mt-8 grid gap-4">
              {previewPortals.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-white/5 px-4 py-5">
                  <div className="flex items-center justify-between">
                    <span className="text-lg text-text">{item}</span>
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Badge tone="cyan">AI insights</Badge>
                <h2 className="mt-4 text-3xl font-semibold">Live market intelligence</h2>
              </div>
              <Star className="h-5 w-5 text-warning" />
            </div>
            {landingInsights[0] ? (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-medium text-text">{landingInsights[0].title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{landingInsights[0].body}</p>
              </div>
            ) : null}
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={demandForecast}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#8ea0c3", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#8ea0c3", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#101C30", borderRadius: 18, border: "1px solid rgba(255,255,255,0.12)" }}
                  />
                  <Line type="monotone" dataKey="actual" stroke="#00A8E8" strokeWidth={3} />
                  <Line type="monotone" dataKey="forecast" stroke="#7B61FF" strokeWidth={3} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassPanel>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-6 py-16 md:grid-cols-5">
          {heroStats.slice(0, 5).map((item) => (
            <GlassPanel key={item.label} className="text-center">
              <div className="text-5xl font-semibold text-text">{item.value}</div>
              <p className="mt-3 text-sm leading-6 text-muted">{item.label}</p>
            </GlassPanel>
          ))}
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-8">
            <Badge tone="purple">Customer proof</Badge>
            <h2 className="mt-4 text-4xl font-semibold">Sliding testimonials from ambitious teams</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((item) => (
              <GlassPanel key={item.name} className="h-full">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent font-semibold text-white">
                    {item.name.split(" ").map((part) => part[0]).join("")}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted">{item.company}</p>
                  </div>
                </div>
                <p className="mt-6 text-base leading-7 text-text/90">{item.quote}</p>
              </GlassPanel>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-24">
          <GlassPanel className="overflow-hidden bg-gradient-to-r from-primary/20 via-accent/15 to-background p-10">
            <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
              <div>
                <Badge tone="cyan">Final CTA</Badge>
                <h2 className="mt-4 text-4xl font-semibold">Make hiring intelligence feel inevitable</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                  Launch a premium AI-native product experience for recruiters, candidates, and enterprise operators from one coherent frontend.
                </p>
              </div>
              <div className="flex flex-wrap gap-4">
                <Link to="/recruiter"><Button>Open Recruiter Portal</Button></Link>
                <Link to="/candidate"><Button variant="secondary">Open Candidate Portal</Button></Link>
              </div>
            </div>
          </GlassPanel>
        </section>
      </div>
    </div>
  );
}
