import { readFileSync, appendFileSync } from "node:fs";

const files = readFileSync(0, "utf8")
    .split(/\r?\n/)
    .map((file) => file.trim().replaceAll("\\", "/"))
    .filter(Boolean);

const sectionLinks = [
    { match: (file) => file === "members2.html" || file.startsWith("members/"), name: "BTS member profiles", url: "/members2.html" },
    { match: (file) => file === "achievements.html" || file.startsWith("achievements/"), name: "Achievements", url: "/achievements.html" },
    { match: (file) => file === "streaming-goals.html" || file.startsWith("streaming.html/"), name: "Streaming goals", url: "/streaming-goals.html" },
    { match: (file) => file.startsWith("Votings.html/"), name: "Voting guides", url: "/Votings.html/index.html" },
    { match: (file) => file.startsWith("truth.html/"), name: "Truth archive", url: "/truth.html/index.html" },
    { match: (file) => file.startsWith("protect.html/"), name: "Protect Angels", url: "/protect.html/index.html" },
    { match: (file) => file.startsWith("peace.html/"), name: "ARMY memorials", url: "/peace.html/index.html" },
    { match: (file) => file === "dashboard.html" || file.startsWith("css/") || file.startsWith("js/"), name: "BTS Universe dashboard", url: "/dashboard.html" },
    { match: (file) => file.startsWith("assets/"), name: "Website images and media", url: "/dashboard.html" }
];

const changedSections = new Map();
for (const file of files) {
    const section = sectionLinks.find((item) => item.match(file));
    if (section) {
        changedSections.set(section.name, section.url);
    }
}

const output = process.env.GITHUB_OUTPUT;
if (!output) {
    throw new Error("GITHUB_OUTPUT is required.");
}

if (changedSections.size === 0) {
    appendFileSync(output, "should_notify=false\n");
} else {
    const names = [...changedSections.keys()];
    const body = `Updated sections: ${names.join(", ")}`.slice(0, 300);
    const url = changedSections.values().next().value;
    appendFileSync(output, `should_notify=true\ntitle=BTS Universe update\nbody=${body}\nurl=${url}\n`);
}
