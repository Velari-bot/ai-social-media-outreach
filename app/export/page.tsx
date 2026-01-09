"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-helpers";
import { fetchRecentRequests } from "@/lib/api-client";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar";

interface CreatorOutreachData {
  id: string;
  campaignName: string;
  platform: "TikTok" | "Instagram" | "YouTube" | "Twitch";
  creatorHandle: string;
  creatorName: string;
  email: string;
  followers: number;
  avgViews: number;
  engagementRate: number;
  audienceCountry: string;
  status: "Sent" | "Follow-up" | "Replied" | "Interested";
  replyType?: "Interested" | "Question" | "Not a fit";
  replied: boolean;
  responseTime?: number; // hours
  followupsSent: number;
  aiTag?: string;
  personalizationScore?: number;
  emailVariant?: string;
  lastContactedDate: string;
  replyDate?: string;
  source: string;
  tags?: string[];
  selected?: boolean;
}

interface SummaryStats {
  totalCreators: number;
  emailsSent: number;
  repliesReceived: number;
  replyRate: number;
  interestedCreators: number;
  avgResponseTime: number;
}

interface FilterState {
  campaigns: string[];
  platforms: ("TikTok" | "Instagram" | "YouTube" | "Twitch")[];
  statuses: ("Sent" | "Follow-up" | "Replied" | "Interested")[];
  dateRange: { start: string; end: string };
  replyTypes: ("Interested" | "Question" | "Not a fit")[];
  minFollowers: string;
  minEngagementRate: string;
  tags: string[];
  emailSent: "all" | "yes" | "no";
}

const AVAILABLE_COLUMNS = [
  { id: "campaignName", label: "Campaign Name" },
  { id: "platform", label: "Platform" },
  { id: "creatorHandle", label: "Creator Handle" },
  { id: "creatorName", label: "Creator Name" },
  { id: "email", label: "Email" },
  { id: "followers", label: "Followers" },
  { id: "avgViews", label: "Avg Views" },
  { id: "engagementRate", label: "Engagement Rate" },
  { id: "audienceCountry", label: "Audience Country %" },
  { id: "status", label: "Status" },
  { id: "replyType", label: "Reply Type" },
  { id: "replied", label: "Replied (Yes/No)" },
  { id: "responseTime", label: "Response Time (hrs)" },
  { id: "followupsSent", label: "Follow-ups Sent" },
  { id: "aiTag", label: "AI Tag" },
  { id: "personalizationScore", label: "Personalization Score" },
  { id: "emailVariant", label: "Email Variant" },
  { id: "lastContactedDate", label: "Last Contacted Date" },
  { id: "replyDate", label: "Reply Date" },
  { id: "source", label: "Source" },
] as const;

export default function ExportPage({ searchParams }: { searchParams: { demo?: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rawData, setRawData] = useState<CreatorOutreachData[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [exportFormat, setExportFormat] = useState<"csv" | "sheets">("csv");
  const [fileName, setFileName] = useState("");
  const [includeSummary, setIncludeSummary] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const rowsPerPage = 20;

  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.map(col => col.id)
  );

  const [filters, setFilters] = useState<FilterState>({
    campaigns: [],
    platforms: [],
    statuses: [],
    dateRange: { start: "", end: "" },
    replyTypes: [],
    minFollowers: "",
    minEngagementRate: "",
    tags: [],
    emailSent: "all",
  });

  const availableCampaigns = useMemo(() => {
    const campaigns = new Set(rawData.map(d => d.campaignName));
    return Array.from(campaigns).sort();
  }, [rawData]);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    rawData.forEach(d => {
      d.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [rawData]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...rawData];

    // Apply filters
    if (filters.campaigns.length > 0) {
      result = result.filter(d => filters.campaigns.includes(d.campaignName));
    }
    if (filters.platforms.length > 0) {
      result = result.filter(d => filters.platforms.includes(d.platform));
    }
    if (filters.statuses.length > 0) {
      result = result.filter(d => filters.statuses.includes(d.status));
    }
    if (filters.replyTypes.length > 0) {
      result = result.filter(d => d.replyType && filters.replyTypes.includes(d.replyType));
    }
    if (filters.minFollowers) {
      const min = parseInt(filters.minFollowers);
      result = result.filter(d => d.followers >= min);
    }
    if (filters.minEngagementRate) {
      const min = parseFloat(filters.minEngagementRate);
      result = result.filter(d => d.engagementRate >= min);
    }
    if (filters.tags.length > 0) {
      result = result.filter(d => d.tags?.some(tag => filters.tags.includes(tag)));
    }
    if (filters.emailSent !== "all") {
      result = result.filter(d => filters.emailSent === "yes" ? d.replied : !d.replied);
    }
    if (filters.dateRange.start) {
      result = result.filter(d => d.lastContactedDate >= filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      result = result.filter(d => d.lastContactedDate <= filters.dateRange.end);
    }

    // Apply sorting
    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = (a as any)[sortColumn];
        const bVal = (b as any)[sortColumn];
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        if (typeof aVal === "string") {
          return sortDirection === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
      });
    }

    return result;
  }, [rawData, filters, sortColumn, sortDirection]);

  // Calculate summary stats
  const summaryStats: SummaryStats = useMemo(() => {
    const total = filteredData.length;
    const sent = filteredData.filter(d => d.status !== "Sent" || d.lastContactedDate).length;
    const replied = filteredData.filter(d => d.replied).length;
    const interested = filteredData.filter(d => d.replyType === "Interested").length;
    const repliedWithTime = filteredData.filter(d => d.responseTime !== undefined);
    const avgResponseTime = repliedWithTime.length > 0
      ? repliedWithTime.reduce((sum, d) => sum + (d.responseTime || 0), 0) / repliedWithTime.length
      : 0;

    return {
      totalCreators: total,
      emailsSent: sent,
      repliesReceived: replied,
      replyRate: sent > 0 ? (replied / sent) * 100 : 0,
      interestedCreators: interested,
      avgResponseTime: avgResponseTime,
    };
  }, [filteredData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    async function loadUserAndData() {
      // Check for demo mode
      const demoMode = searchParams?.demo === "true";

      if (demoMode) {
        setUserId("demo-user");
        // Mock data
        const mockData: CreatorOutreachData[] = [
          { id: "1", campaignName: "Demo Campaign", platform: "YouTube", creatorHandle: "@FrostBytePlays", creatorName: "Alex “FrostByte” Chen", email: "frostbyte@gamingmail.com", followers: 248000, avgViews: 55400, engagementRate: 4.8, audienceCountry: "US 52%, CA 12%, UK 10%, DE 8%", status: "Replied", replyType: "Interested", replied: true, responseTime: 14, followupsSent: 1, aiTag: "✔", personalizationScore: 9, emailVariant: "B", lastContactedDate: "2026-01-03", replyDate: "2026-01-04", source: "Hashtag" },
          { id: "2", campaignName: "Demo Campaign", platform: "Twitch", creatorHandle: "@NOVA_Geek", creatorName: "Nina Patel", email: "nova_geek@streamhub.com", followers: 312500, avgViews: 22100, engagementRate: 9.2, audienceCountry: "US 48%, UK 14%, AU 6%", status: "Replied", replyType: "Interested", replied: true, responseTime: 27, followupsSent: 2, aiTag: "✔", personalizationScore: 8, emailVariant: "A", lastContactedDate: "2025-12-30", replyDate: "2026-01-01", source: "CRM List" },
          { id: "3", campaignName: "Demo Campaign", platform: "TikTok", creatorHandle: "@PwnWizard", creatorName: "Marcus Lee", email: "pwnwizard@tokmail.com", followers: 186200, avgViews: 67300, engagementRate: 13.5, audienceCountry: "US 40%, PH 15%, BR 10%", status: "Sent", replied: false, followupsSent: 1, aiTag: "✘", personalizationScore: 7, emailVariant: "C", lastContactedDate: "2026-01-02", source: "Inbound" },
          { id: "4", campaignName: "Demo Campaign", platform: "YouTube", creatorHandle: "@GlitchGuru", creatorName: "Samantha “Sam” Ortiz", email: "glitchguru@ytcreator.com", followers: 412800, avgViews: 82500, engagementRate: 6.1, audienceCountry: "US 38%, UK 20%, CA 10%", status: "Sent", replied: false, followupsSent: 0, aiTag: "✘", personalizationScore: 8, emailVariant: "A", lastContactedDate: "2026-01-05", source: "Outreach" },
          { id: "5", campaignName: "Demo Campaign", platform: "Instagram", creatorHandle: "@FPS_Master", creatorName: "Eli Robinson", email: "fps_master@insta.com", followers: 98700, avgViews: 9800, engagementRate: 5.5, audienceCountry: "US 60%, UK 8%, MX 7%", status: "Replied", replyType: "Interested", replied: true, responseTime: 5, followupsSent: 1, aiTag: "✔", personalizationScore: 6, emailVariant: "C", lastContactedDate: "2026-01-06", replyDate: "2026-01-06", source: "Search" },
          { id: "6", campaignName: "Demo Campaign", platform: "YouTube", creatorHandle: "@TechTactic", creatorName: "Jordan Kim", email: "techtactic@youtubemail.com", followers: 274300, avgViews: 45300, engagementRate: 7.0, audienceCountry: "US 50%, CA 15%, UK 9%", status: "Sent", replied: false, followupsSent: 1, aiTag: "✘", personalizationScore: 7, emailVariant: "B", lastContactedDate: "2026-01-04", source: "Outreach" },
          { id: "7", campaignName: "Demo Campaign", platform: "Twitch", creatorHandle: "@LagBusters", creatorName: "Olivia Nguyen", email: "lagbusters@streammail.com", followers: 159900, avgViews: 18700, engagementRate: 8.8, audienceCountry: "US 42%, UK 12%, CA 9%", status: "Replied", replyType: "Interested", replied: true, responseTime: 12, followupsSent: 2, aiTag: "✔", personalizationScore: 8, emailVariant: "A", lastContactedDate: "2025-12-29", replyDate: "2025-12-30", source: "CRM List" },
          { id: "8", campaignName: "Demo Campaign", platform: "TikTok", creatorHandle: "@PC_Perf_Guru", creatorName: "Carlos “PCGuru” Mendez", email: "pc_perfguru@tokmail.com", followers: 223400, avgViews: 52800, engagementRate: 12.2, audienceCountry: "US 45%, ES 10%, BR 10%", status: "Sent", replied: false, followupsSent: 0, aiTag: "✘", personalizationScore: 9, emailVariant: "A", lastContactedDate: "2026-01-03", source: "Influencer DB" },
          { id: "9", campaignName: "Demo Campaign", platform: "YouTube", creatorHandle: "@HighFPS_Hero", creatorName: "Zoe Sinclair", email: "highfps_hero@gamingmail.com", followers: 321100, avgViews: 74900, engagementRate: 5.9, audienceCountry: "US 47%, UK 17%, CA 11%", status: "Replied", replyType: "Interested", replied: true, responseTime: 9, followupsSent: 1, aiTag: "✔", personalizationScore: 8, emailVariant: "B", lastContactedDate: "2026-01-01", replyDate: "2026-01-02", source: "Hashtag" },
          { id: "10", campaignName: "Demo Campaign", platform: "Instagram", creatorHandle: "@BuildsByBen", creatorName: "Ben Thompson", email: "buildsbyben@insta.com", followers: 87600, avgViews: 8400, engagementRate: 4.9, audienceCountry: "US 58%, DE 6%, UK 6%", status: "Sent", replied: false, followupsSent: 0, aiTag: "✘", personalizationScore: 6, emailVariant: "C", lastContactedDate: "2026-01-06", source: "Outreach" },
          { id: "11", campaignName: "Demo Campaign", platform: "YouTube", creatorHandle: "@ShroudFanZ", creatorName: "Derek Wu", email: "shroudfanz@ytmail.com", followers: 532900, avgViews: 110200, engagementRate: 5.2, audienceCountry: "US 55%, CA 10%, UK 9%", status: "Replied", replyType: "Interested", replied: true, responseTime: 30, followupsSent: 1, aiTag: "✔", personalizationScore: 7, emailVariant: "B", lastContactedDate: "2025-12-28", replyDate: "2025-12-29", source: "CRM List" },
          { id: "12", campaignName: "Demo Campaign", platform: "TikTok", creatorHandle: "@FPSFairy", creatorName: "Alana Brooks", email: "fpsfairy@tokmail.com", followers: 140300, avgViews: 29400, engagementRate: 10.7, audienceCountry: "US 46%, PH 12%, BR 9%", status: "Sent", replied: false, followupsSent: 1, aiTag: "✘", personalizationScore: 7, emailVariant: "C", lastContactedDate: "2026-01-02", source: "Search" },
          { id: "13", campaignName: "Demo Campaign", platform: "Twitch", creatorHandle: "@ClipKing", creatorName: "Mateo Garcia", email: "clipking@streamhub.com", followers: 278400, avgViews: 25900, engagementRate: 7.9, audienceCountry: "US 49%, UK 11%, CA 10%", status: "Replied", replyType: "Interested", replied: true, responseTime: 22, followupsSent: 2, aiTag: "✔", personalizationScore: 9, emailVariant: "A", lastContactedDate: "2025-12-27", replyDate: "2025-12-28", source: "Influencer DB" },
          { id: "14", campaignName: "Demo Campaign", platform: "YouTube", creatorHandle: "@BenchmarkBabe", creatorName: "Tara Singh", email: "benchmarkbabe@ytmail.com", followers: 193700, avgViews: 38600, engagementRate: 6.5, audienceCountry: "US 42%, UK 14%, CA 8%", status: "Sent", replied: false, followupsSent: 0, aiTag: "✘", personalizationScore: 8, emailVariant: "B", lastContactedDate: "2026-01-05", source: "Outreach" },
          { id: "15", campaignName: "Demo Campaign", platform: "Instagram", creatorHandle: "@Queue_QT", creatorName: "Quinn Parker", email: "queue_qt@insta.com", followers: 64500, avgViews: 6700, engagementRate: 5.1, audienceCountry: "US 65%, UK 7%, AU 5%", status: "Replied", replyType: "Interested", replied: true, responseTime: 4, followupsSent: 1, aiTag: "✔", personalizationScore: 5, emailVariant: "C", lastContactedDate: "2026-01-07", replyDate: "2026-01-07", source: "Search" },
          { id: "16", campaignName: "Demo Campaign", platform: "Twitch", creatorHandle: "@0msDream", creatorName: "Satvik Rao", email: "0msdream@streammail.com", followers: 202800, avgViews: 21500, engagementRate: 9.5, audienceCountry: "US 50%, CA 13%, UK 8%", status: "Sent", replied: false, followupsSent: 1, aiTag: "✘", personalizationScore: 8, emailVariant: "A", lastContactedDate: "2026-01-04", source: "CRM List" },
          { id: "17", campaignName: "Demo Campaign", platform: "YouTube", creatorHandle: "@GPU_Guru", creatorName: "Rachel Adams", email: "gpu_guru@youtubemail.com", followers: 349500, avgViews: 68900, engagementRate: 4.4, audienceCountry: "US 44%, DE 11%, UK 10%", status: "Replied", replyType: "Interested", replied: true, responseTime: 17, followupsSent: 2, aiTag: "✔", personalizationScore: 7, emailVariant: "B", lastContactedDate: "2025-12-31", replyDate: "2026-01-01", source: "Hashtag" },
          { id: "18", campaignName: "Demo Campaign", platform: "TikTok", creatorHandle: "@Rig_Rundown", creatorName: "Ethan Zhou", email: "rig_rundown@tokmail.com", followers: 158600, avgViews: 40300, engagementRate: 11.8, audienceCountry: "US 43%, BR 13%, PH 12%", status: "Sent", replied: false, followupsSent: 0, aiTag: "✘", personalizationScore: 9, emailVariant: "A", lastContactedDate: "2026-01-03", source: "Influencer DB" },
          { id: "19", campaignName: "Demo Campaign", platform: "Instagram", creatorHandle: "@GameSenseGal", creatorName: "Mia Lopez", email: "gamesensegal@insta.com", followers: 92200, avgViews: 10200, engagementRate: 6.2, audienceCountry: "US 54%, UK 9%, CA 8%", status: "Replied", replyType: "Interested", replied: true, responseTime: 6, followupsSent: 1, aiTag: "✔", personalizationScore: 7, emailVariant: "B", lastContactedDate: "2026-01-05", replyDate: "2026-01-06", source: "Search" },
          { id: "20", campaignName: "Demo Campaign", platform: "Twitch", creatorHandle: "@PingPals", creatorName: "Logan & Lex", email: "pingpals@streamhub.com", followers: 276900, avgViews: 26800, engagementRate: 8.3, audienceCountry: "US 48%, UK 10%, AU 7%", status: "Replied", replyType: "Interested", replied: true, responseTime: 20, followupsSent: 2, aiTag: "✔", personalizationScore: 8, emailVariant: "A", lastContactedDate: "2025-12-26", replyDate: "2025-12-27", source: "CRM List" },
          { id: "21", campaignName: "Demo Campaign", platform: "YouTube", creatorHandle: "@ShaderShred", creatorName: "Ivan Petrov", email: "shadershred@youtubemail.com", followers: 207400, avgViews: 44000, engagementRate: 5.7, audienceCountry: "US 41%, RU 15%, UK 8%", status: "Sent", replied: false, followupsSent: 1, aiTag: "✘", personalizationScore: 7, emailVariant: "B", lastContactedDate: "2026-01-02", source: "Outreach" },
          { id: "22", campaignName: "Demo Campaign", platform: "TikTok", creatorHandle: "@FrameFreak", creatorName: "Layla Hassan", email: "framefreak@tokmail.com", followers: 185900, avgViews: 55100, engagementRate: 12.9, audienceCountry: "US 39%, EG 11%, SA 9%", status: "Replied", replyType: "Interested", replied: true, responseTime: 8, followupsSent: 1, aiTag: "✔", personalizationScore: 9, emailVariant: "A", lastContactedDate: "2026-01-01", replyDate: "2026-01-02", source: "Hashtag" },
          { id: "23", campaignName: "Demo Campaign", platform: "Instagram", creatorHandle: "@BoostBuilds", creatorName: "Carter Young", email: "boostbuilds@insta.com", followers: 77300, avgViews: 7900, engagementRate: 5.8, audienceCountry: "US 57%, UK 8%, CA 7%", status: "Sent", replied: false, followupsSent: 0, aiTag: "✘", personalizationScore: 6, emailVariant: "C", lastContactedDate: "2026-01-06", source: "Search" },
          { id: "24", campaignName: "Demo Campaign", platform: "YouTube", creatorHandle: "@LatencyLegend", creatorName: "Noah Kim", email: "latencylegend@youtubemail.com", followers: 421200, avgViews: 90400, engagementRate: 5.4, audienceCountry: "US 49%, CA 14%, UK 11%", status: "Replied", replyType: "Interested", replied: true, responseTime: 15, followupsSent: 2, aiTag: "✔", personalizationScore: 8, emailVariant: "A", lastContactedDate: "2025-12-29", "source": "CRM List", replyDate: "2025-12-30" },
          { id: "25", campaignName: "Demo Campaign", platform: "Twitch", creatorHandle: "@OptiM8", creatorName: "Priya Singh", email: "opti_m8@streamhub.com", followers: 236800, avgViews: 19900, engagementRate: 10.0, audienceCountry: "US 46%, UK 12%, IN 10%", status: "Sent", replied: false, followupsSent: 1, aiTag: "✘", personalizationScore: 8, emailVariant: "B", lastContactedDate: "2026-01-04", source: "Outreach" }
        ];
        setRawData(mockData);
        setFileName(`creator-outreach-export-DEMO`);
        setLoading(false);
        return;
      }

      try {
        const user = getCurrentUser();

        if (!user) {
          toast.error("Please log in to continue");
          router.push("/login");
          return;
        }

        setUserId(user.uid);

        // Fetch campaigns
        try {
          const requestsResponse = await fetchRecentRequests(100);
          if (requestsResponse.success && requestsResponse.requests) {
            const requests = requestsResponse.requests;
            // Process requests if needed
          }
        } catch (error) {
          console.error('Error fetching requests:', error);
        }

        // TODO: Fetch actual creator outreach data from database
        // This will need a creator_outreach table in the database
        // For now, set empty array
        setRawData([]);
        setFileName(`creator-outreach-export-${new Date().toISOString().split('T')[0]}`);
      } catch (error: any) {
        console.error("Error loading export data:", error);
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    }

    loadUserAndData();
  }, [router]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Get visible columns
    const visibleColumns = AVAILABLE_COLUMNS.filter(col => selectedColumns.includes(col.id));
    const headers = visibleColumns.map(col => col.label);

    // Create CSV rows
    const rows = filteredData.map(item => {
      return visibleColumns.map(col => {
        const value = (item as any)[col.id];
        if (value === undefined || value === null) return "";
        if (typeof value === "boolean") return value ? "Yes" : "No";
        if (Array.isArray(value)) return value.join(", ");
        return String(value);
      });
    });

    // Add summary if requested
    let csvContent = [headers.join(",")];
    if (includeSummary) {
      csvContent.push(""); // Empty row
      csvContent.push("Summary Statistics");
      csvContent.push(`Total Creators,${summaryStats.totalCreators}`);
      csvContent.push(`Emails Sent,${summaryStats.emailsSent}`);
      csvContent.push(`Replies Received,${summaryStats.repliesReceived}`);
      csvContent.push(`Reply Rate %,${summaryStats.replyRate.toFixed(2)}`);
      csvContent.push(`Interested Creators,${summaryStats.interestedCreators}`);
      csvContent.push(`Avg Response Time (hrs),${summaryStats.avgResponseTime.toFixed(1)}`);
      csvContent.push(""); // Empty row
      csvContent.push("Data"); // Section header
    }

    // Add data rows
    csvContent.push(...rows.map(row => row.map(cell => `"${cell}"`).join(",")));

    // Create blob and download
    const blob = new Blob([csvContent.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowExportModal(false);
    toast.success(`Exported ${filteredData.length} records to CSV`);
  };

  const handleExportSheets = () => {
    toast.loading("Google Sheets integration coming soon...");
    setTimeout(() => {
      toast.dismiss();
      toast.error("Google Sheets integration is not yet available");
      setShowExportModal(false);
    }, 2000);
  };

  const toggleColumn = (columnId: string) => {
    if (selectedColumns.includes(columnId)) {
      if (selectedColumns.length > 1) {
        setSelectedColumns(selectedColumns.filter(id => id !== columnId));
      } else {
        toast.error("At least one column must be selected");
      }
    } else {
      setSelectedColumns([...selectedColumns, columnId]);
    }
  };

  const visibleColumns = AVAILABLE_COLUMNS.filter(col => selectedColumns.includes(col.id));

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F5F3EF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading export data...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F3EF] font-sans">
      <Navbar />

      <div className="w-full px-4 sm:px-6 pt-24 pb-8 sm:pb-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-black text-black mb-2 tracking-tight">Export Data</h1>
                <p className="text-lg text-gray-700">
                  Download or sync your creator outreach results
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowExportModal(true)}
                  disabled={filteredData.length === 0}
                  className="px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-900 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    setExportFormat("sheets");
                    setShowExportModal(true);
                  }}
                  disabled={filteredData.length === 0}
                  className="px-6 py-3 bg-white border-2 border-gray-200 text-black rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Sync to Google Sheets
                </button>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-black flex items-center"
                >
                  Back
                </Link>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-black text-black">{summaryStats.totalCreators}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mt-1">Total Creators</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-black text-black">{summaryStats.emailsSent}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mt-1">Emails Sent</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-black text-blue-600">{summaryStats.repliesReceived}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mt-1">Replies Received</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-black text-green-600">{summaryStats.replyRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mt-1">Reply Rate</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-black text-purple-600">{summaryStats.interestedCreators}</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mt-1">Interested</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-black text-gray-600">{summaryStats.avgResponseTime.toFixed(1)}h</div>
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wider mt-1">Avg Response</div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Filters</h2>
              <button
                onClick={() => setFilters({
                  campaigns: [],
                  platforms: [],
                  statuses: [],
                  dateRange: { start: "", end: "" },
                  replyTypes: [],
                  minFollowers: "",
                  minEngagementRate: "",
                  tags: [],
                  emailSent: "all",
                })}
                className="text-sm text-gray-600 hover:text-black transition-colors"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Campaign Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign</label>
                <select
                  multiple
                  value={filters.campaigns}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFilters({ ...filters, campaigns: selected });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black text-black"
                  size={3}
                >
                  {availableCampaigns.map(campaign => (
                    <option key={campaign} value={campaign}>{campaign}</option>
                  ))}
                </select>
              </div>

              {/* Platform Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <div className="space-y-2">
                  {(["TikTok", "Instagram", "YouTube"] as const).map(platform => (
                    <label key={platform} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.platforms.includes(platform)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({ ...filters, platforms: [...filters.platforms, platform] });
                          } else {
                            setFilters({ ...filters, platforms: filters.platforms.filter(p => p !== platform) });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <div className="space-y-2">
                  {(["Sent", "Follow-up", "Replied", "Interested"] as const).map(status => (
                    <label key={status} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.statuses.includes(status)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({ ...filters, statuses: [...filters.statuses, status] });
                          } else {
                            setFilters({ ...filters, statuses: filters.statuses.filter(s => s !== status) });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{status}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters({ ...filters, dateRange: { ...filters.dateRange, start: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black text-black"
                    placeholder="Start Date"
                  />
                  <input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters({ ...filters, dateRange: { ...filters.dateRange, end: e.target.value } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black text-black"
                    placeholder="End Date"
                  />
                </div>
              </div>

              {/* Reply Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reply Type</label>
                <div className="space-y-2">
                  {(["Interested", "Question", "Not a fit"] as const).map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.replyTypes.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters({ ...filters, replyTypes: [...filters.replyTypes, type] });
                          } else {
                            setFilters({ ...filters, replyTypes: filters.replyTypes.filter(t => t !== type) });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Min Followers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Followers</label>
                <input
                  type="number"
                  value={filters.minFollowers}
                  onChange={(e) => setFilters({ ...filters, minFollowers: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black text-black"
                  placeholder="e.g., 10000"
                />
              </div>

              {/* Min Engagement Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Engagement Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={filters.minEngagementRate}
                  onChange={(e) => setFilters({ ...filters, minEngagementRate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black text-black"
                  placeholder="e.g., 3.5"
                />
              </div>

              {/* Email Sent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Sent</label>
                <select
                  value={filters.emailSent}
                  onChange={(e) => setFilters({ ...filters, emailSent: e.target.value as "all" | "yes" | "no" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-black text-black"
                >
                  <option value="all">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Column Selector & Preview */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-black">Data Preview</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Showing {filteredData.length} of {rawData.length} records
                  {filteredData.length !== rawData.length && " (filtered)"}
                </p>
              </div>
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-black flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                Select Columns ({selectedColumns.length}/{AVAILABLE_COLUMNS.length})
              </button>
            </div>

            {/* Column Selector Modal */}
            {showColumnSelector && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AVAILABLE_COLUMNS.map(column => (
                    <label key={column.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedColumns.includes(column.id)}
                        onChange={() => toggleColumn(column.id)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{column.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                      <input
                        type="checkbox"
                        checked={paginatedData.every(d => d.selected)}
                        onChange={(e) => {
                          paginatedData.forEach(item => {
                            item.selected = e.target.checked;
                          });
                          setRawData([...rawData]);
                        }}
                        className="rounded border-gray-300"
                      />
                    </th>
                    {visibleColumns.map(column => (
                      <th
                        key={column.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort(column.id)}
                      >
                        <div className="flex items-center gap-2">
                          {column.label}
                          {sortColumn === column.id && (
                            <svg
                              className={`w-4 h-4 ${sortDirection === "asc" ? "" : "transform rotate-180"}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {paginatedData.length > 0 ? (
                    paginatedData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={item.selected || false}
                            onChange={(e) => {
                              item.selected = e.target.checked;
                              setRawData([...rawData]);
                            }}
                            className="rounded border-gray-300"
                          />
                        </td>
                        {visibleColumns.map(column => {
                          const value = (item as any)[column.id];
                          let displayValue = value;

                          if (value === undefined || value === null) displayValue = "-";
                          else if (typeof value === "boolean") displayValue = value ? "Yes" : "No";
                          else if (Array.isArray(value)) displayValue = value.join(", ");
                          else if (typeof value === "number" && column.id.includes("Rate")) displayValue = `${value}%`;
                          else if (typeof value === "number" && column.id.includes("Score")) displayValue = value.toFixed(1);

                          return (
                            <td key={column.id} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                              {column.id === "status" ? (
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${value === "Interested" ? "bg-green-100 text-green-800" :
                                  value === "Replied" ? "bg-blue-100 text-blue-800" :
                                    value === "Follow-up" ? "bg-yellow-100 text-yellow-800" :
                                      "bg-gray-100 text-gray-800"
                                  }`}>
                                  {displayValue}
                                </span>
                              ) : column.id === "platform" ? (
                                <span className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                  {displayValue}
                                </span>
                              ) : (
                                <span className={typeof value === "number" ? "font-mono" : ""}>{displayValue}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={visibleColumns.length + 1} className="px-6 py-12 text-center text-gray-600">
                        No data available to export
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * rowsPerPage + 1} to {Math.min(currentPage * rowsPerPage, filteredData.length)} of {filteredData.length} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-900"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-gray-900"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-black mb-4">Export Options</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">File Name</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-black"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeSummary}
                    onChange={(e) => setIncludeSummary(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Include summary metrics</span>
                </label>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHistory}
                    onChange={(e) => setIncludeHistory(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Include conversation history</span>
                </label>
              </div>

              <div className="pt-4 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    if (exportFormat === "csv") {
                      handleExportCSV();
                    } else {
                      handleExportSheets();
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors font-medium"
                >
                  {exportFormat === "csv" ? "Export CSV" : "Sync to Sheets"}
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-black rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
