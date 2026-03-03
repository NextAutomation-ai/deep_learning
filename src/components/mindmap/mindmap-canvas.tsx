"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useMindmapData, type MindmapNode, type MindmapLink } from "@/hooks/use-mindmap";
import { useMindmapStore } from "@/stores/mindmap-store";
import type { ColorMode } from "@/stores/mindmap-store";
import { RELATIONSHIP_STYLES, DIRECTIONAL_TYPES } from "./mindmap-legend";

interface SimNode extends MindmapNode {
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink extends Omit<MindmapLink, "source" | "target"> {
  source: SimNode | string;
  target: SimNode | string;
}

export function MindmapCanvas({ contentId }: { contentId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { data, isLoading } = useMindmapData(contentId);
  const { colorMode, searchQuery, showLabels, selectNode } = useMindmapStore();

  useEffect(() => {
    if (!svgRef.current || !data?.nodes?.length) return;

    const svg = d3.select(svgRef.current);
    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    svg.selectAll("*").remove();

    // Arrow marker definitions for directional relationship types
    const defs = svg.append("defs");
    for (const [type, style] of Object.entries(RELATIONSHIP_STYLES)) {
      if (DIRECTIONAL_TYPES.has(type)) {
        defs
          .append("marker")
          .attr("id", `arrow-${type}`)
          .attr("viewBox", "0 -5 10 10")
          .attr("refX", 28)
          .attr("refY", 0)
          .attr("markerWidth", 7)
          .attr("markerHeight", 7)
          .attr("orient", "auto")
          .append("path")
          .attr("d", "M0,-4L8,0L0,4")
          .attr("fill", style.color);
      }
    }

    // Zoom
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => container.attr("transform", event.transform));
    svg.call(zoom);

    const container = svg.append("g");

    // Filter by search
    const filteredNodes: SimNode[] = data.nodes
      .filter((n) =>
        searchQuery
          ? n.name.toLowerCase().includes(searchQuery.toLowerCase())
          : true
      )
      .map((n) => ({ ...n }));

    const nodeIds = new Set(filteredNodes.map((n) => n.id));
    const filteredLinks: SimLink[] = data.links
      .filter(
        (l) =>
          nodeIds.has(l.source as string) && nodeIds.has(l.target as string)
      )
      .map((l) => ({ ...l }));

    // Simulation with improved forces
    const simulation = d3
      .forceSimulation<SimNode>(filteredNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(filteredLinks)
          .id((d) => d.id)
          .distance(180)
          .strength((d) => (d.strength ?? 0.5) * 0.3)
      )
      .force("charge", d3.forceManyBody().strength(-400))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3
          .forceCollide<SimNode>()
          .radius((d) => getRadius(d.importanceScore) + 16)
      );

    // Links — styled by relationship type
    const link = container
      .append("g")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", (d) => getLinkColor(d.relationshipType))
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", (d) => Math.max(1.5, (d.strength ?? 0.5) * 3))
      .attr("stroke-dasharray", (d) => getLinkDash(d.relationshipType))
      .attr("marker-end", (d) =>
        DIRECTIONAL_TYPES.has(d.relationshipType || "")
          ? `url(#arrow-${d.relationshipType})`
          : null
      );

    // Invisible hit area for link hover
    const linkHitArea = container
      .append("g")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", "transparent")
      .attr("stroke-width", 14)
      .attr("cursor", "pointer");

    // Link labels (hidden by default, shown on hover)
    const linkLabel = container
      .append("g")
      .selectAll("text")
      .data(filteredLinks)
      .join("text")
      .text((d) => {
        const type = (d.relationshipType || "related").replace(/_/g, " ");
        return type.charAt(0).toUpperCase() + type.slice(1);
      })
      .attr("font-size", 10)
      .attr("fill", (d) => getLinkColor(d.relationshipType))
      .attr("text-anchor", "middle")
      .attr("dy", -8)
      .attr("pointer-events", "none")
      .attr("font-weight", "600")
      .style("display", "none")
      .style("paint-order", "stroke")
      .style("stroke", "var(--color-surface, #fff)")
      .style("stroke-width", "3px");

    // Link hover — show label and highlight
    linkHitArea
      .on("mouseenter", (_, d) => {
        linkLabel.filter((ld) => ld === d).style("display", "block");
        link
          .filter((ld) => ld === d)
          .attr("stroke-opacity", 1)
          .attr("stroke-width", (ld) =>
            Math.max(2.5, (ld.strength ?? 0.5) * 4)
          );
      })
      .on("mouseleave", (_, d) => {
        linkLabel.filter((ld) => ld === d).style("display", "none");
        link
          .filter((ld) => ld === d)
          .attr("stroke-opacity", 0.5)
          .attr("stroke-width", (ld) =>
            Math.max(1.5, (ld.strength ?? 0.5) * 3)
          );
      });

    // Nodes
    const node = container
      .append("g")
      .selectAll("circle")
      .data(filteredNodes)
      .join("circle")
      .attr("r", (d) => getRadius(d.importanceScore))
      .attr("fill", (d) => getColor(d, colorMode))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("click", (_, d) => selectNode(d.id));

    // Drag behavior
    const dragBehavior = d3
      .drag<SVGCircleElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    node.call(dragBehavior as any);

    // Tooltips
    node.append("title").text((d) => `${d.name}\n${d.definition}`);

    // Labels — below nodes, truncated, scaled by importance, with text stroke for readability
    const label = container
      .append("g")
      .selectAll("text")
      .data(filteredNodes)
      .join("text")
      .text((d) => (d.name.length > 22 ? d.name.slice(0, 20) + "\u2026" : d.name))
      .attr("font-size", (d) => {
        const importance = d.importanceScore ?? 0.5;
        return Math.max(10, 9 + importance * 4);
      })
      .attr("font-weight", (d) =>
        (d.importanceScore ?? 0.5) > 0.7 ? "600" : "400"
      )
      .attr("fill", "var(--color-text-primary)")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => getRadius(d.importanceScore) + 14)
      .attr("pointer-events", "none")
      .style("display", showLabels ? "block" : "none")
      .style("paint-order", "stroke")
      .style("stroke", "var(--color-surface, #fff)")
      .style("stroke-width", "3px");

    // Tick — update positions for all elements
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      linkHitArea
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      linkLabel
        .attr(
          "x",
          (d) =>
            ((d.source as SimNode).x! + (d.target as SimNode).x!) / 2
        )
        .attr(
          "y",
          (d) =>
            ((d.source as SimNode).y! + (d.target as SimNode).y!) / 2
        );

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      label.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    // Initial zoom to fit
    setTimeout(() => {
      const bounds = container.node()?.getBBox();
      if (bounds) {
        const dx = bounds.width;
        const dy = bounds.height;
        const x = bounds.x + dx / 2;
        const y = bounds.y + dy / 2;
        const scale = Math.min(
          0.8,
          0.9 / Math.max(dx / width, dy / height)
        );
        const transform = d3.zoomIdentity
          .translate(width / 2, height / 2)
          .scale(scale)
          .translate(-x, -y);
        svg.transition().duration(750).call(zoom.transform, transform);
      }
    }, 1000);

    return () => {
      simulation.stop();
    };
  }, [data, colorMode, searchQuery, showLabels, selectNode]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-secondary">Loading mind map...</p>
      </div>
    );
  }

  if (!data?.nodes?.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-secondary">No concepts to visualize.</p>
      </div>
    );
  }

  return <svg ref={svgRef} className="h-full w-full" />;
}

function getRadius(importance: number | null): number {
  return 8 + (importance ?? 0.5) * 18;
}

function getLinkColor(type: string | null): string {
  return RELATIONSHIP_STYLES[type || "related"]?.color || "#94a3b8";
}

function getLinkDash(type: string | null): string {
  return RELATIONSHIP_STYLES[type || "related"]?.dashArray || "none";
}

function getColor(node: MindmapNode, mode: ColorMode): string {
  switch (mode) {
    case "mastery": {
      const m = node.masteryLevel;
      if (m >= 0.75) return "#22c55e";
      if (m >= 0.5) return "#eab308";
      if (m > 0) return "#f97316";
      return "#94a3b8";
    }
    case "difficulty": {
      const d = (node.difficultyLevel ?? 1) / 5;
      const colors = ["#93c5fd", "#60a5fa", "#3b82f6", "#2563eb", "#1d4ed8"];
      return colors[Math.min(Math.floor(d * 5), 4)];
    }
    case "blooms": {
      const bloomColors: Record<string, string> = {
        remember: "#3b82f6",
        understand: "#06b6d4",
        apply: "#10b981",
        analyze: "#f59e0b",
        evaluate: "#ef4444",
        create: "#8b5cf6",
      };
      return bloomColors[node.bloomsLevel ?? "remember"] ?? "#94a3b8";
    }
  }
}
