import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME, UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG } from "../shared/const";
import type { TrpcContext } from "./_core/context";
import { SUBSCRIPTION_TIERS } from "./stripe/products";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// ─── Helpers ───

function createUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-001",
    email: "test@revvelpress.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    stripeCustomerId: null,
    subscriptionTier: "free",
    stripeSubscriptionId: null,
    tokensBalance: 50,
    tokensUsedThisMonth: 0,
    monthlyTokenAllowance: 50,
    trialEndsAt: null,
    accessibilitySettings: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

function createCtx(user: AuthenticatedUser | null = null): { ctx: TrpcContext; clearedCookies: { name: string; options: Record<string, unknown> }[] } {
  const clearedCookies: { name: string; options: Record<string, unknown> }[] = [];
  return {
    ctx: {
      user,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {
        clearCookie: (name: string, options: Record<string, unknown>) => {
          clearedCookies.push({ name, options });
        },
      } as TrpcContext["res"],
    },
    clearedCookies,
  };
}

// ─── Auth Tests ───

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user object for authenticated users", async () => {
    const user = createUser();
    const { ctx } = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@revvelpress.com");
    expect(result?.name).toBe("Test User");
    expect(result?.role).toBe("user");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const user = createUser();
    const { ctx, clearedCookies } = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

// ─── Billing Tests ───

describe("billing.getPlans", () => {
  it("returns all subscription tiers", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    expect(plans).toBeDefined();
    expect(plans.free).toBeDefined();
    expect(plans.starter).toBeDefined();
    expect(plans.professional).toBeDefined();
    expect(plans.enterprise).toBeDefined();
  });

  it("free tier has correct token count", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    expect(plans.free.monthlyTokens).toBe(50);
    expect(plans.free.priceMonthly).toBe(0);
  });

  it("all paid tiers have stripePriceId", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    expect((plans.starter as any).stripePriceId).toBeDefined();
    expect((plans.professional as any).stripePriceId).toBeDefined();
    expect((plans.enterprise as any).stripePriceId).toBeDefined();
  });

  it("tier pricing is in ascending order", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.billing.getPlans();
    expect(plans.free.priceMonthly).toBeLessThan(plans.starter.priceMonthly);
    expect(plans.starter.priceMonthly).toBeLessThan(plans.professional.priceMonthly);
    expect(plans.professional.priceMonthly).toBeLessThan(plans.enterprise.priceMonthly);
  });
});

describe("billing.getUsage", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.billing.getUsage()).rejects.toThrow(UNAUTHED_ERR_MSG);
  });
});

describe("billing.createCheckout", () => {
  it("rejects unauthenticated users", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.billing.createCheckout({ tier: "starter", origin: "https://example.com" })
    ).rejects.toThrow(UNAUTHED_ERR_MSG);
  });
});

// ─── Papers Tests ───

describe("papers", () => {
  it("rejects unauthenticated list request", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.papers.list()).rejects.toThrow(UNAUTHED_ERR_MSG);
  });

  it("rejects unauthenticated create request", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.papers.create({ title: "Test Paper" })).rejects.toThrow(UNAUTHED_ERR_MSG);
  });

  it("rejects unauthenticated get request", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.papers.get({ id: 1 })).rejects.toThrow(UNAUTHED_ERR_MSG);
  });

  it("validates title is required for create", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.papers.create({ title: "" })).rejects.toThrow();
  });
});

// ─── Content Tests ───

describe("content", () => {
  it("rejects unauthenticated generate request", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.content.generate({ paperId: 1, contentType: "twitter_thread" })
    ).rejects.toThrow(UNAUTHED_ERR_MSG);
  });

  it("rejects unauthenticated listAll request", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.content.listAll()).rejects.toThrow(UNAUTHED_ERR_MSG);
  });
});

// ─── Calendar Tests ───

describe("calendar", () => {
  it("rejects unauthenticated list request", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.calendar.list()).rejects.toThrow(UNAUTHED_ERR_MSG);
  });

  it("rejects unauthenticated create request", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.calendar.create({ title: "Test Event", scheduledAt: new Date().toISOString() })
    ).rejects.toThrow(UNAUTHED_ERR_MSG);
  });
});

// ─── Settings Tests ───

describe("settings", () => {
  it("rejects unauthenticated getAccessibility request", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.settings.getAccessibility()).rejects.toThrow(UNAUTHED_ERR_MSG);
  });

  it("rejects unauthenticated updateAccessibility request", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.settings.updateAccessibility({ ecoCode: true })
    ).rejects.toThrow(UNAUTHED_ERR_MSG);
  });
});

// ─── Support Tests ───

describe("support", () => {
  it("rejects unauthenticated ticket creation", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.support.createTicket({ subject: "Test", message: "Help me" })
    ).rejects.toThrow(UNAUTHED_ERR_MSG);
  });

  it("rejects unauthenticated ticket listing", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.support.listTickets()).rejects.toThrow(UNAUTHED_ERR_MSG);
  });
});

// ─── Admin Tests ───

describe("admin", () => {
  it("rejects non-admin users from getAnalytics", async () => {
    const user = createUser({ role: "user" });
    const { ctx } = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getAnalytics()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
  });

  it("rejects non-admin users from getUsers", async () => {
    const user = createUser({ role: "user" });
    const { ctx } = createCtx(user);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getUsers()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
  });

  it("rejects unauthenticated users from admin routes", async () => {
    const { ctx } = createCtx(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.getAnalytics()).rejects.toThrow(NOT_ADMIN_ERR_MSG);
  });
});

// ─── Products Configuration Tests ───

describe("SUBSCRIPTION_TIERS", () => {
  it("has all required tiers", () => {
    expect(SUBSCRIPTION_TIERS.free).toBeDefined();
    expect(SUBSCRIPTION_TIERS.starter).toBeDefined();
    expect(SUBSCRIPTION_TIERS.professional).toBeDefined();
    expect(SUBSCRIPTION_TIERS.enterprise).toBeDefined();
  });

  it("each tier has required fields", () => {
    for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
      expect(tier.name).toBeDefined();
      expect(tier.monthlyTokens).toBeGreaterThanOrEqual(0);
      expect(tier.priceMonthly).toBeGreaterThanOrEqual(0);
      expect(tier.features).toBeDefined();
      expect(Array.isArray(tier.features)).toBe(true);
      expect(tier.features.length).toBeGreaterThan(0);
    }
  });

  it("token allowance increases with tier", () => {
    expect(SUBSCRIPTION_TIERS.free.monthlyTokens).toBeLessThan(SUBSCRIPTION_TIERS.starter.monthlyTokens);
    expect(SUBSCRIPTION_TIERS.starter.monthlyTokens).toBeLessThan(SUBSCRIPTION_TIERS.professional.monthlyTokens);
    expect(SUBSCRIPTION_TIERS.professional.monthlyTokens).toBeLessThan(SUBSCRIPTION_TIERS.enterprise.monthlyTokens);
  });
});
