"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useMindmapData, type MindmapNode, type MindmapLink } from "@/hooks/use-mindmap";
import { useMindmapStore } from "@/stores/mindmap-store";
import type { ColorMode } from "@/stores/mindmap-store";

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

    // Simulation
    const simulation = d3
      .forceSimulation<SimNode>(filteredNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(filteredLinks)
          .id((d) => d.id)
          .distance(120)
          .strength((d) => (d.strength ?? 0.5) * 0.5)
      )
      .force("charge", d3.forceManyBody().strength(-250))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3
          .forceCollide<SimNode>()
          .radius((d) => getRadius(d.importanceScore) + 8)
      );

    // Links
    const link = container
      .append("g")
      .selectAll("line")
      .data(filteredLinks)
      .join("line")
      .attr("stroke", "#64748B")
      .attr("stroke-opacity", 0.3)
      .attr("stroke-width", (d) => Math.max(1, (d.strength ?? 0.5) * 3));

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

    // Add drag behavior
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
    node
      .append("title")
      .text((d) => `${d.name}\n${d.definition}`);

    // Labels
    const label = container
      .append("g")
      .selectAll("text")
      .data(filteredNodes)
      .join("text")
      .text((d) => d.name)
      .attr("font-size", 10)
      .attr("fill", "var(--color-text-secondary)")
      .attr("dx", (d) => getRadius(d.importanceScore) + 4)
      .attr("dy", 3)
      .attr("pointer-events", "none")
      .style("display", showLabels ? "block" : "none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);
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
        const scale = Math.min(0.8, 0.9 / Math.max(dx / width, dy / height));
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
