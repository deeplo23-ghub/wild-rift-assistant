"use client";
import React from "react";
import { TeamPanel } from "./TeamPanel";
import { TeamSide } from "@/types/draft";

export const EnemyPanel: React.FC = () => <TeamPanel side={TeamSide.Enemy} />;
