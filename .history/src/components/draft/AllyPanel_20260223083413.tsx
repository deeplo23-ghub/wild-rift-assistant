"use client";
import React from "react";
import { TeamPanel } from "./TeamPanel";
import { TeamSide } from "@/types/draft";

export const AllyPanel: React.FC = () => <TeamPanel side={TeamSide.Ally} />;
