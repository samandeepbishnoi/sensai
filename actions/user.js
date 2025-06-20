"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getUserOnboardingStatus() {
  const { userId } = await auth();
  if (!userId) {
    console.error("❌ Unauthorized: No userId from Clerk.");
    throw new Error("Unauthorized");
  }

  try {
    const user = await db.user.findUnique({
      where: { clerkUserId: userId },
      select: { industry: true },
    });

    if (!user) {
      console.error("❌ No user found for clerkUserId:", userId);
      throw new Error("User not found");
    }

    const isOnboarded = !!user.industry;
    console.log(`✅ Onboarding status for ${userId}:`, isOnboarded);

    return { isOnboarded };
  } catch (error) {
    console.error("❌ Error checking onboarding status:", error);
    throw new Error("Failed to check onboarding status");
  }
}

export async function updateUser(data) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  console.log("➡️ Starting user update for:", userId);
  console.log("📦 Received data:", data);

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    // 1. Ensure IndustryInsight exists
    let industryInsight = await db.industryInsight.findUnique({
      where: { industry: data.industry },
    });

    if (!industryInsight) {
      console.log("⚠️ Industry not found. Creating new industry entry:", data.industry);

      industryInsight = await db.industryInsight.create({
        data: {
          industry: data.industry,
          salaryRanges: [],
          growthRate: 0.0, // or fetch from external API later
          demandLevel: "Medium",
          topSkills: [],
          marketOutlook: "Neutral",
          keyTrends: [],
          recommendedSkills: [],
          nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      console.log("✅ Industry created");
    }

    // 2. Update the user
    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        industry: data.industry,
        experience: data.experience,
        bio: data.bio,
        skills: data.skills,
      },
    });

    console.log("✅ User updated:", updatedUser.id);

    revalidatePath("/");
    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("❌ Error updating user:", error.message);
    throw new Error("Failed to update profile");
  }
}
