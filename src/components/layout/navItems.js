import {
    LayoutDashboard, Users, GraduationCap, ArrowUpCircle, Settings, Upload, ClipboardList, Film, Newspaper, Image,
    Wallet, HeartHandshake, CalendarDays, Table2, Undo2, History, SlidersHorizontal,
} from "lucide-react";

// The sidebar menu. Also used for browser-tab titles, so they always match.
export const navGroups = [
    { label: "Overview", items: [{ path: "/", label: "Dashboard", icon: LayoutDashboard }] },
    {
        label: "People",
        items: [
            { path: "/admins", label: "Admins", icon: Users },
            { path: "/students", label: "Students", icon: GraduationCap },
            { path: "/students/promote", label: "Promotion", icon: ArrowUpCircle },
            { path: "/students/promotion-rules", label: "Promotion Rules", icon: SlidersHorizontal },
            { path: "/students/revert", label: "Promotion History", icon: Undo2 },
            { path: "/students/results-history", label: "Results History", icon: History },
            { path: "/fees", label: "Fees", icon: Wallet },
        ],
    },
    {
        label: "Academics",
        items: [
            { path: "/academic-setup", label: "Setup", icon: Settings },
            { path: "/upload-scores", label: "Upload Scores", icon: Upload },
            { path: "/results-manager", label: "Results", icon: ClipboardList },
            { path: "/broadsheet", label: "Broadsheet", icon: Table2 },
            { path: "/behavioral", label: "Behavioral", icon: HeartHandshake },
        ],
    },
    {
        label: "Website",
        items: [
            { path: "/content", label: "Content", icon: Film },
            { path: "/news", label: "News", icon: Newspaper },
            { path: "/galleries", label: "Galleries", icon: Image },
            { path: "/events", label: "Events", icon: CalendarDays },
        ],
    },
];

const allItems = navGroups.flatMap((g) => g.items);

/** The menu item for a URL: the most specific match, so /students/promote is "Promotion", not "Students". */
export function activeItem(pathname) {
    if (pathname === "/") return allItems[0];
    return allItems
        .filter((i) => i.path !== "/" && (pathname === i.path || pathname.startsWith(i.path + "/")))
        .sort((a, b) => b.path.length - a.path.length)[0] || null;
}

// Pages that are not in the menu.
const EXTRA_TITLES = [
    [/^\/students\/create$/, "Add Student"], [/^\/students\/\d+\/edit$/, "Edit Student"], [/^\/students\/bulk-upload$/, "Bulk Upload"],
    [/^\/admins\/create$/, "Add Admin"], [/^\/admins\/\d+\/edit$/, "Edit Admin"],
    [/^\/content\/create$/, "Add Content"], [/^\/content\/\d+\/edit$/, "Edit Content"],
    [/^\/news\/create$/, "Add News"], [/^\/news\/\d+\/edit$/, "Edit News"],
    [/^\/galleries\/create$/, "Add Gallery"], [/^\/galleries\/\d+\/edit$/, "Edit Gallery"],
    [/^\/events\/new$/, "Add Event"], [/^\/events\/\d+\/edit$/, "Edit Event"],
    [/^\/exam-results$/, "Import CBT Scores"], [/^\/ca-scores$/, "Upload CA Scores"], [/^\/profile$/, "My Profile"],
];

export function pageTitle(pathname) {
    const extra = EXTRA_TITLES.find(([re]) => re.test(pathname));
    if (extra) return extra[1];
    return activeItem(pathname)?.label || "Page not found";
}
