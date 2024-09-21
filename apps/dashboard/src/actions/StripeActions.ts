"use server";

import { redirect } from "next/navigation";

import {
  generatePaidPlanCheckout,
  generateStripeBillingManagementLink,
  getProjectFromUser,
} from "@socketless/api/logic";
import { db } from "@socketless/db/client";

import { validateRequest } from "~/server/auth";

export async function manageBilling(projectId: number) {
  const { user } = await validateRequest();

  if (user === null) {
    throw new Error("User not found");
  }

  const projectData = await getProjectFromUser(db, user.id, projectId);

  if (projectData === undefined) {
    throw new Error("Project not found");
  }

  const panelLink = await generateStripeBillingManagementLink(
    db,
    projectData.id,
  );

  redirect(panelLink);
}

export async function upgradePlan(projectId: number) {
  const { user } = await validateRequest();

  if (user === null) {
    throw new Error("User not found");
  }

  const projectData = await getProjectFromUser(db, user.id, projectId);

  if (projectData === undefined) {
    throw new Error("Project not found");
  }

  if (projectData.stripePlan !== "FREE") {
    throw new Error("Project already has a paid plan");
  }

  const checkoutLink = await generatePaidPlanCheckout(db, projectData.id);

  if (checkoutLink === undefined) {
    throw new Error("Failed to generate checkout link");
  }

  redirect(checkoutLink);
}
