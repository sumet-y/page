/* =========================================================
   AI IT SUPPORT COPILOT V2
   ========================================================= */


/* =========================================================
   SUPABASE CONFIG
   ========================================================= */

const SUPABASE_URL =
    "https://cpdakjvwsvtottatulwo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_XM-TOIhVRRMqtPCQpIsX8A_XECc2BEv";

// Semantic Knowledge Search Edge Function
const SEARCH_KNOWLEDGE_URL =
    `${SUPABASE_URL}/functions/v1/search-knowledge`;


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =========================================================
   STATE
   ========================================================= */

let tickets = [];

let selectedTicket = null;

let knowledgeCache = [];


/* =========================================================
   DOM
   ========================================================= */

const $ = (id) =>
    document.getElementById(id);


/* =========================================================
   INIT
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        bindEvents();

        await testConnection();

        await loadTickets();

    }
);


/* =========================================================
   EVENTS
   ========================================================= */

function bindEvents() {


    $("refreshBtn")
        ?.addEventListener(
            "click",
            async () => {

                await loadTickets();

                showToast(
                    "Refresh สำเร็จ"
                );

            }
        );


    $("ticketSearch")
        ?.addEventListener(
            "input",
            renderTickets
        );


    $("statusFilter")
        ?.addEventListener(
            "change",
            renderTickets
        );


    $("searchKnowledgeBtn")
        ?.addEventListener(
            "click",
            searchKnowledge
        );


    $("knowledgeQuery")
        ?.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter"
                ) {

                    searchKnowledge();

                }

            }
        );


    $("saveKnowledgeBtn")
        ?.addEventListener(
            "click",
            () => {

                showToast(
                    "Knowledge Learning จะเชื่อมกับ Module 6"
                );

            }
        );

}


/* =========================================================
   SUPABASE CONNECTION
   ========================================================= */

async function testConnection() {

    const status =
        $("connectionStatus");


    try {

        const {
            error
        } =
        await supabaseClient
            .from("tickets")
            .select("id")
            .limit(1);


        if (error) {

            throw error;

        }


        status.className =
            "status-pill connected";

        status.innerHTML =
            '<span class="status-dot"></span> SUPABASE CONNECTED';


    } catch (error) {

        console.error(
            "Supabase connection error:",
            error
        );


        status.className =
            "status-pill connecting";

        status.innerHTML =
            '<span class="status-dot"></span> DATABASE ERROR';

    }

}


/* =========================================================
   LOAD TICKETS
   ========================================================= */

async function loadTickets() {

    $("ticketList").innerHTML =
        '<div class="loading">Loading tickets...</div>';


    try {

        const {
            data,
            error
        } =
        await supabaseClient
            .from("tickets")
            .select("*")
            .order(
                "id",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        tickets =
            data || [];


        updateSummary();

        renderTickets();


        /*
         * Automatically select first ticket
         * if nothing is selected.
         */

        if (
            !selectedTicket &&
            tickets.length > 0
        ) {

            selectTicket(
                tickets[0]
            );

        }


    } catch (error) {

        console.error(
            "Load tickets error:",
            error
        );


        $("ticketList").innerHTML = `

            <div class="loading">

                ❌ ไม่สามารถโหลด Ticket ได้

                <br><br>

                <small>
                    ${escapeHtml(
                        error.message ||
                        "Database Error"
                    )}
                </small>

            </div>

        `;

    }

}


/* =========================================================
   SUMMARY
   ========================================================= */

function updateSummary() {

    const total =
        tickets.length;


    const open =
        tickets.filter(
            t =>
                normalizeStatus(
                    t.status
                ) === "open"
        ).length;


    const progress =
        tickets.filter(
            t =>
                normalizeStatus(
                    t.status
                ) === "in progress"
        ).length;


    const resolved =
        tickets.filter(
            t =>
                [
                    "resolved",
                    "closed"
                ].includes(
                    normalizeStatus(
                        t.status
                    )
                )
        ).length;


    $("totalTickets")
        .textContent = total;

    $("openTickets")
        .textContent = open;

    $("progressTickets")
        .textContent = progress;

    $("resolvedTickets")
        .textContent = resolved;

}


/* =========================================================
   RENDER TICKETS
   ========================================================= */

function renderTickets() {

    const container =
        $("ticketList");


    const keyword =
        (
            $("ticketSearch")
                ?.value || ""
        )
        .toLowerCase()
        .trim();


    const status =
        $("statusFilter")
            ?.value || "";


    const filtered =
        tickets.filter(
            ticket => {

                const searchable = [

                    ticket.ticket_no,

                    ticket.user_name,

                    ticket.system_type,

                    ticket.problem

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                const matchKeyword =
                    !keyword ||
                    searchable.includes(
                        keyword
                    );


                const matchStatus =
                    !status ||
                    ticket.status === status;


                return (
                    matchKeyword &&
                    matchStatus
                );

            }
        );


    if (
        filtered.length === 0
    ) {

        container.innerHTML = `

            <div class="loading">

                🔎

                <br><br>

                ไม่พบ Ticket

            </div>

        `;

        return;

    }


    container.innerHTML =
        filtered
            .map(
                ticket =>
                    ticketCard(
                        ticket
                    )
            )
            .join("");


    container
        .querySelectorAll(
            ".ticket-item"
        )
        .forEach(
            element => {

                element.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                element.dataset.id
                            );


                        const ticket =
                            tickets.find(
                                t =>
                                    Number(
                                        t.id
                                    ) === id
                            );


                        if (ticket) {

                            selectTicket(
                                ticket
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   TICKET CARD
   ========================================================= */

function ticketCard(
    ticket
) {

    const active =
        selectedTicket &&
        Number(
            selectedTicket.id
        ) === Number(
            ticket.id
        );


    const statusClass =
        normalizeStatus(
            ticket.status
        )
        .replace(
            /\s+/g,
            "-"
        );


    return `

        <div
            class="ticket-item ${
                active ? "active" : ""
            }"
            data-id="${ticket.id}"
        >

            <div class="ticket-number">

                ${escapeHtml(
                    ticket.ticket_no ||
                    `TICKET-${ticket.id}`
                )}

            </div>


            <div class="ticket-item-problem">

                ${escapeHtml(
                    ticket.problem ||
                    "No problem description"
                )}

            </div>


            <div class="ticket-item-user">

                ${escapeHtml(
                    ticket.user_name ||
                    "-"
                )}

                ${ticket.system_type
                    ? " • " +
                      escapeHtml(
                          ticket.system_type
                      )
                    : ""
                }

            </div>


            <div class="ticket-item-bottom">

                <span
                    class="status-badge ${statusClass}"
                >

                    ${escapeHtml(
                        ticket.status ||
                        "-"
                    )}

                </span>

            </div>

        </div>

    `;

}


/* =========================================================
   SELECT TICKET
   ========================================================= */

function selectTicket(
    ticket
) {

    selectedTicket =
        ticket;


    $("emptyState")
        .classList
        .add("hidden");


    $("ticketWorkspace")
        .classList
        .remove("hidden");


    $("detailTicketNo")
        .textContent =
        ticket.ticket_no ||
        `TICKET-${ticket.id}`;


    $("detailProblem")
        .textContent =
        ticket.problem ||
        "ไม่ระบุปัญหา";


    $("detailProblemText")
        .textContent =
        ticket.problem ||
        "ไม่ระบุรายละเอียด";


    $("detailUser")
        .textContent =
        ticket.user_name ||
        "-";


    $("detailSystem")
        .textContent =
        ticket.system_type ||
        "-";


    const status =
        $("detailStatus");


    status.textContent =
        ticket.status ||
        "-";


    status.className =
        "status-badge " +
        normalizeStatus(
            ticket.status
        )
        .replace(
            /\s+/g,
            "-"
        );


    /*
     * Put problem into AI Search
     */

    $("knowledgeQuery")
        .value =
        ticket.problem ||
        "";


    /*
     * Clear previous search results
     */

    $("knowledgeResults")
        .innerHTML = `

        <div class="knowledge-empty">

            พร้อมค้นหา Case ที่ใกล้เคียง

        </div>

    `;


    $("knowledgeStatus")
        .textContent =
        "กด Search เพื่อค้นหา Knowledge Base";


    renderTickets();

}


/* =========================================================
   KNOWLEDGE SEARCH
   ========================================================= */




/* =========================================================
   KNOWLEDGE RANKING
   ========================================================= */

function rankKnowledge(
    query,
    knowledge
) {

    const q =
        query
            .toLowerCase();


    const words =
        q
            .split(
                /\s+/u
            )
            .filter(
                word =>
                    word.length >= 2
            );


    return knowledge
        .map(
            item => {

                const text = [

                    item.title,

                    item.category,

                    item.symptom,

                    item.environment,

                    item.root_cause,

                    item.solution,

                    item.verification

                ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


                let score = 0;


                /*
                 * Exact phrase
                 */

                if (
                    text.includes(q)
                ) {

                    score += 50;

                }


                /*
                 * Word match
                 */

                words.forEach(
                    word => {

                        if (
                            text.includes(
                                word
                            )
                        ) {

                            score += 5;

                        }

                    }
                );


                /*
                 * Category/system match
                 */

                if (
                    selectedTicket &&
                    item.category &&
                    selectedTicket.system_type &&
                    item.category
                        .toLowerCase()
                        .includes(
                            selectedTicket
                                .system_type
                                .toLowerCase()
                        )
                ) {

                    score += 20;

                }


                return {

                    ...item,

                    score

                };

            }
        )
        .filter(
            item =>
                item.score > 0
        )
        .sort(
            (a, b) =>
                b.score -
                a.score
        )
        .slice(
            0,
            5
        );

}


/* =========================================================
   RENDER KNOWLEDGE
   ========================================================= */

function renderKnowledgeResults(
    results
) {

    const container =
        $("knowledgeResults");


    if (
        results.length === 0
    ) {

        $("knowledgeStatus")
            .textContent =
            "ไม่พบ Case ที่เกี่ยวข้อง";


        container.innerHTML = `

            <div class="knowledge-empty">

                🔎 ไม่พบ Knowledge Case

                <br><br>

                ลองใช้คำค้นอื่น

            </div>

        `;

        return;

    }


    $("knowledgeStatus")
        .textContent =
        `พบ ${results.length} Similar Case`;


    container.innerHTML =
        results
            .map(
                item => {

                    const similarity =
                        Math.min(
                            99,
                            Math.max(
                                55,
                                item.score
                            )
                        );


                    return `

                        <div
                            class="knowledge-result"
                        >

                            <div
                                class="knowledge-result-top"
                            >

                                <h4>

                                    ${escapeHtml(
                                        item.title ||
                                        "Knowledge Case"
                                    )}

                                </h4>


                                <span
                                    class="similarity"
                                >

                                    ${similarity}%

                                </span>

                            </div>


                            <p>

                                <strong>
                                    Category:
                                </strong>

                                ${escapeHtml(
                                    item.category ||
                                    "-"
                                )}

                                <br>

                                <strong>
                                    Symptom:
                                </strong>

                                ${escapeHtml(
                                    item.symptom ||
                                    "-"
                                )}

                                <br>

                                <strong>
                                    Root Cause:
                                </strong>

                                ${escapeHtml(
                                    item.root_cause ||
                                    "-"
                                )}

                                <br>

                                <strong>
                                    Solution:
                                </strong>

                                ${escapeHtml(
                                    item.solution ||
                                    "-"
                                )}

                            </p>

                        </div>

                    `;

                }
            )
            .join("");

}


/* =========================================================
   HELPERS
   ========================================================= */

function normalizeStatus(
    status
) {

    return String(
        status || ""
    )
    .trim()
    .toLowerCase();

}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
    .replace(
        /&/g,
        "&amp;"
    )
    .replace(
        /</g,
        "&lt;"
    )
    .replace(
        />/g,
        "&gt;"
    )
    .replace(
        /"/g,
        "&quot;"
    )
    .replace(
        /'/g,
        "&#039;"
    );

}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(
    message
) {

    const toast =
        $("toast");


    toast.textContent =
        message;


    toast.classList.add(
        "show"
    );


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2500
    );

}

/* =========================================================
   AI IT SUPPORT COPILOT V1.0
   MODULE 3-6 FINAL LAYER
   ========================================================= */

/*
 * Module 3:
 * Hybrid Knowledge Search
 * - Uses existing knowledge_base immediately.
 * - Keeps a semantic-search adapter ready for a future RPC/Edge Function.
 *
 * Module 4:
 * Root Cause Analysis from the selected ticket + similar KB cases.
 *
 * Module 5:
 * Generates a practical troubleshooting checklist.
 *
 * Module 6:
 * Saves an approved resolution back into knowledge_base.
 */

let aiCopilotContext = {
    results: [],
    rootCause: null,
    troubleshooting: []
};

function getTicketContext() {
    return selectedTicket || {};
}

function normalizeText(value) {
    return String(value ?? "")
        .toLowerCase()
        .normalize("NFKC")
        .replace(/[^\p{L}\p{N}\s.+#_-]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function tokenize(value) {
    return normalizeText(value)
        .split(/\s+/u)
        .filter(w => w.length >= 2);
}

function buildKnowledgeText(item) {
    return [
        item.title,
        item.category,
        item.symptom,
        item.environment,
        item.root_cause,
        item.solution,
        item.verification
    ].filter(Boolean).join(" ");
}

/*
 * FINAL Module 3 search.
 * Uses the Supabase Edge Function `search-knowledge`
 * for semantic vector search, then enriches the results with
 * structured fields from `knowledge_base` so Modules 4-6 can
 * continue using Root Cause / Solution / Verification evidence.
 */
async function searchKnowledge() {

    const query = ($("knowledgeQuery")?.value || "").trim();

    if (!query) {
        showToast("กรุณาระบุข้อความที่ต้องการค้นหา");
        return;
    }

    const statusEl = $("knowledgeStatus");
    const resultEl = $("knowledgeResults");

    if (statusEl) {
        statusEl.textContent = "🔎 กำลังค้นหา Semantic Knowledge...";
    }

    if (resultEl) {
        resultEl.innerHTML = `
            <div class="knowledge-empty">
                <div style="font-size:28px">🧠</div>
                <strong>AI กำลังค้นหา Case ที่ใกล้เคียง...</strong>
                <br>
                <small>กำลังสร้าง Query Vector และค้นหา Similar Knowledge</small>
            </div>
        `;
    }

    try {

        /*
         * Module 3 — Semantic Vector Search
         *
         * The browser calls the Supabase Edge Function with the
         * publishable key only. Never expose the service-role key here.
         */
        const response = await fetch(
            SEARCH_KNOWLEDGE_URL,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": SUPABASE_PUBLISHABLE_KEY
                },
                body: JSON.stringify({
                    query
                })
            }
        );

        let payload = {};

        try {
            payload = await response.json();
        } catch {
            payload = {};
        }

        if (!response.ok || payload.success !== true) {
            throw new Error(
                payload.error ||
                payload.message ||
                `search-knowledge failed (${response.status})`
            );
        }

        const semanticResults = Array.isArray(payload.results)
            ? payload.results
            : [];

        /*
         * The Edge Function returns:
         *   id
         *   knowledge_id
         *   content
         *   similarity
         *
         * Module 4-6 also need the structured Knowledge Base fields,
         * so enrich the semantic results with the matching records.
         */
        const knowledgeIds = [
            ...new Set(
                semanticResults
                    .map(item => Number(item.knowledge_id))
                    .filter(Number.isFinite)
            )
        ];

        let knowledgeRows = [];

        if (knowledgeIds.length > 0) {

            const {
                data,
                error
            } = await supabaseClient
                .from("knowledge_base")
                .select(
                    "id,title,category,symptom,environment,root_cause,solution,verification"
                )
                .in("id", knowledgeIds);

            if (error) {
                throw error;
            }

            knowledgeRows = data || [];
        }

        const knowledgeMap = new Map(
            knowledgeRows.map(item => [
                Number(item.id),
                item
            ])
        );

        const results = semanticResults.map(item => {

            const knowledge =
                knowledgeMap.get(
                    Number(item.knowledge_id)
                ) || {};

            const similarity = Number(
                item.similarity || 0
            );

            return {
                ...knowledge,
                id: knowledge.id ?? item.knowledge_id,
                knowledge_id: item.knowledge_id,
                content: item.content || "",
                similarity,
                score: Math.max(
                    0,
                    Math.min(100, similarity * 100)
                )
            };
        });

        aiCopilotContext.results = results;

        renderKnowledgeResultsV1(results);

        if (statusEl) {
            statusEl.textContent = results.length
                ? `พบ ${results.length} Similar Case จาก Semantic Search`
                : "ไม่พบ Case ที่มีความหมายใกล้เคียง";
        }

        if (!results.length) {
            showToast("ไม่พบ Similar Knowledge");
        } else {
            showToast(
                `พบ ${results.length} Similar Case`
            );
        }

    } catch (error) {

        console.error(
            "Semantic Knowledge Search Error:",
            error
        );

        if (statusEl) {
            statusEl.textContent =
                "❌ Semantic Search Error";
        }

        if (resultEl) {
            resultEl.innerHTML = `
                <div class="knowledge-empty">
                    ❌ ไม่สามารถค้นหา Semantic Knowledge ได้
                    <br><br>
                    <small>${escapeHtml(
                        error.message ||
                        "Search Error"
                    )}</small>
                </div>
            `;
        }
    }
}

function rankKnowledgeV1(query, knowledge) {

    const q = normalizeText(query);
    const words = tokenize(query);
    const ticket = getTicketContext();
    const system = normalizeText(ticket.system_type);

    return knowledge
        .map(item => {

            const title = normalizeText(item.title);
            const category = normalizeText(item.category);
            const symptom = normalizeText(item.symptom);
            const environment = normalizeText(item.environment);
            const rootCause = normalizeText(item.root_cause);
            const solution = normalizeText(item.solution);
            const allText = normalizeText(buildKnowledgeText(item));

            let score = 0;
            let matchedWords = 0;

            if (q && allText.includes(q)) score += 45;

            words.forEach(word => {
                if (allText.includes(word)) {
                    score += 5;
                    matchedWords++;
                }
            });

            if (system && category && (
                category.includes(system) ||
                system.includes(category)
            )) {
                score += 25;
            }

            /*
             * Problem/symptom is more important than verification text.
             */
            const problemWords = tokenize(ticket.problem || query);

            problemWords.forEach(word => {
                if (symptom.includes(word)) score += 6;
                if (rootCause.includes(word)) score += 3;
                if (solution.includes(word)) score += 2;
            });

            /*
             * Small bonus for a strong multi-word match.
             */
            if (matchedWords >= 5) score += 10;
            if (matchedWords >= 8) score += 10;

            return {
                ...item,
                score: Math.min(100, score),
                matchedWords
            };
        })
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
}

function renderKnowledgeResultsV1(results) {

    const container = $("knowledgeResults");

    if (!container) return;

    if (!results.length) {

        if ($("knowledgeStatus")) {
            $("knowledgeStatus").textContent =
                "ไม่พบ Knowledge Case ที่มีข้อมูลใกล้เคียง";
        }

        container.innerHTML = `
            <div class="knowledge-empty">
                🔎 <strong>ไม่พบ Similar Case</strong>
                <br><br>
                ลองใช้คำค้นที่สั้นลง หรือเพิ่มอาการ/ระบบที่เกี่ยวข้อง
            </div>
            ${renderEmptyAIPanels()}
        `;

        return;
    }

    if ($("knowledgeStatus")) {
        $("knowledgeStatus").textContent =
            `พบ ${results.length} Similar Case`;
    }

    container.innerHTML = `
        <div class="v1-search-header">
            <div>
                <strong>🧠 AI Knowledge Search</strong>
                <small>Hybrid matching จาก Knowledge Base</small>
            </div>
            <span>${results.length} cases</span>
        </div>

        <div class="v1-knowledge-list">
            ${results.map((item, index) => {

                const similarity = Math.min(
                    99,
                    Math.max(55, Math.round(item.score))
                );

                return `
                    <div class="knowledge-result v1-result">
                        <div class="knowledge-result-top">
                            <h4>
                                #${index + 1}
                                ${escapeHtml(item.title || "Knowledge Case")}
                            </h4>
                            <span class="similarity">${similarity}%</span>
                        </div>

                        <p>
                            <strong>Category:</strong>
                            ${escapeHtml(item.category || "-")}
                            <br>
                            <strong>Symptom:</strong>
                            ${escapeHtml(item.symptom || "-")}
                            <br>
                            <strong>Root Cause:</strong>
                            ${escapeHtml(item.root_cause || "-")}
                            <br>
                            <strong>Solution:</strong>
                            ${escapeHtml(item.solution || "-")}
                        </p>
                    </div>
                `;
            }).join("")}
        </div>

        ${renderAICopilotPanels(results)}
    `;
}

/* =========================================================
   MODULE 4 — ROOT CAUSE ANALYSIS
   ========================================================= */

function analyzeRootCause() {

    const ticket = getTicketContext();

    if (!ticket.id) {
        showToast("กรุณาเลือก Ticket ก่อน");
        return;
    }

    const results = aiCopilotContext.results || [];

    if (!results.length) {
        showToast("กรุณาค้นหา Knowledge ก่อน");
        return;
    }

    const causes = {};

    results.forEach(item => {

        const cause = (item.root_cause || "").trim();

        if (!cause) return;

        const key = normalizeText(cause);

        if (!causes[key]) {
            causes[key] = {
                text: cause,
                score: 0,
                evidence: 0,
                solutions: []
            };
        }

        causes[key].score += Number(item.score || 0);
        causes[key].evidence += 1;

        if (item.solution) {
            causes[key].solutions.push(item.solution);
        }
    });

    const ranked = Object.values(causes)
        .sort((a, b) => {
            if (b.evidence !== a.evidence) {
                return b.evidence - a.evidence;
            }
            return b.score - a.score;
        });

    if (!ranked.length) {
        aiCopilotContext.rootCause = {
            text: "ยังไม่มีข้อมูล Root Cause ที่เพียงพอ",
            confidence: 0,
            evidence: 0
        };
    } else {

        const top = ranked[0];

        const confidence = Math.min(
            95,
            Math.round(
                55 +
                Math.min(25, top.evidence * 8) +
                Math.min(15, top.score / 10)
            )
        );

        aiCopilotContext.rootCause = {
            text: top.text,
            confidence,
            evidence: top.evidence,
            alternatives: ranked.slice(1, 3)
        };
    }

    renderRootCausePanel();
    showToast("Root Cause Analysis เสร็จแล้ว");
}

function renderRootCausePanel() {

    const box = $("v1RootCausePanel");

    if (!box) return;

    const rc = aiCopilotContext.rootCause;

    if (!rc) return;

    const alternatives = (rc.alternatives || [])
        .map(item => `
            <li>
                ${escapeHtml(item.text)}
                <small>(${item.evidence} evidence)</small>
            </li>
        `)
        .join("");

    box.innerHTML = `
        <div class="v1-panel-title">
            <span>🧠 Module 4 — Root Cause Analysis</span>
            <span class="v1-badge">AI ASSISTED</span>
        </div>

        <div class="v1-root-cause-main">
            <div>
                <small>Most likely root cause</small>
                <strong>${escapeHtml(rc.text)}</strong>
            </div>

            <div class="v1-confidence">
                <b>${rc.confidence}%</b>
                <small>confidence</small>
            </div>
        </div>

        <div class="v1-evidence">
            Evidence จาก Similar Case:
            <strong>${rc.evidence || 0}</strong>
        </div>

        ${
            alternatives
            ? `
                <details class="v1-details">
                    <summary>Alternative causes</summary>
                    <ul>${alternatives}</ul>
                </details>
            `
            : ""
        }

        <button
            type="button"
            class="v1-action-btn"
            id="generateTroubleshootingBtn"
        >
            🛠️ Generate Troubleshooting Plan
        </button>
    `;

    $("generateTroubleshootingBtn")
        ?.addEventListener(
            "click",
            generateTroubleshooting
        );
}

/* =========================================================
   MODULE 5 — TROUBLESHOOTING
   ========================================================= */

function generateTroubleshooting() {

    const ticket = getTicketContext();
    const rc = aiCopilotContext.rootCause;

    if (!ticket.id || !rc) {
        showToast("กรุณาทำ Root Cause Analysis ก่อน");
        return;
    }

    const system = normalizeText(ticket.system_type);
    const problem = ticket.problem || "";

    const steps = [];

    /*
     * Generic evidence-first workflow.
     */
    steps.push({
        title: "Confirm Scope",
        action: `ยืนยันว่าอาการ "${problem}" เกิดกับผู้ใช้/อุปกรณ์ใดบ้าง`,
        expected: "ระบุ Scope และเงื่อนไขที่ทำให้เกิดปัญหาได้",
        status: "PENDING"
    });

    if (system.includes("handheld") || system.includes("wifi")) {

        steps.push({
            title: "Check Network",
            action: "ตรวจสอบ RSSI, Link Speed, Packet Loss และการ Roaming",
            expected: "Network path และ Wi-Fi ต้องอยู่ในค่าปกติ",
            status: "PENDING"
        });
    }

    if (
        system.includes("web") ||
        system.includes("application") ||
        system.includes("handheld")
    ) {

        steps.push({
            title: "Check Application Response",
            action: "จับเวลา Request/Response และเปรียบเทียบกับเครื่องหรือสาขาที่ปกติ",
            expected: "แยกได้ว่า delay อยู่ Client, Network หรือ Server",
            status: "PENDING"
        });
    }

    if (
        normalizeText(rc.text).includes("database") ||
        system.includes("web") ||
        system.includes("application")
    ) {

        steps.push({
            title: "Check Database",
            action: "ตรวจสอบ Slow Query, Execution Time, Index และ DB resource",
            expected: "ระบุ Query หรือ resource ที่เป็น bottleneck ได้",
            status: "PENDING"
        });
    }

    steps.push({
        title: "Apply Controlled Fix",
        action: `ทดสอบแนวทางแก้ที่เกี่ยวข้องกับ "${rc.text}" ในขอบเขตที่ควบคุมได้`,
        expected: "อาการลดลงโดยไม่สร้างผลกระทบต่อระบบอื่น",
        status: "PENDING"
    });

    steps.push({
        title: "Verify",
        action: "ทำรายการทดสอบซ้ำและเปรียบเทียบ Before / After",
        expected: "ปัญหาหายหรือ response time กลับสู่ค่าปกติ",
        status: "PENDING"
    });

    aiCopilotContext.troubleshooting = steps;

    renderTroubleshootingPanel();
    showToast("Troubleshooting Plan พร้อมใช้งาน");
}

function renderTroubleshootingPanel() {

    const box = $("v1TroubleshootingPanel");

    if (!box) return;

    const steps = aiCopilotContext.troubleshooting || [];

    box.innerHTML = `
        <div class="v1-panel-title">
            <span>🛠️ Module 5 — Troubleshooting Plan</span>
            <span class="v1-badge">EVIDENCE FIRST</span>
        </div>

        <div class="v1-step-list">
            ${steps.map((step, index) => `
                <div class="v1-step">
                    <div class="v1-step-number">${index + 1}</div>

                    <div class="v1-step-content">
                        <strong>${escapeHtml(step.title)}</strong>
                        <p>${escapeHtml(step.action)}</p>
                        <small>
                            Expected: ${escapeHtml(step.expected)}
                        </small>
                    </div>

                    <span class="v1-step-status">
                        ${escapeHtml(step.status)}
                    </span>
                </div>
            `).join("")}
        </div>

        <button
            type="button"
            class="v1-action-btn"
            id="learnKnowledgeBtn"
        >
            💡 Create Knowledge from this Case
        </button>
    `;

    $("learnKnowledgeBtn")
        ?.addEventListener(
            "click",
            prepareKnowledgeLearning
        );
}

/* =========================================================
   MODULE 6 — KNOWLEDGE LEARNING
   ========================================================= */

function prepareKnowledgeLearning() {

    const ticket = getTicketContext();
    const rc = aiCopilotContext.rootCause;

    if (!ticket.id) {
        showToast("กรุณาเลือก Ticket");
        return;
    }

    const solution =
        (aiCopilotContext.results || [])
            .find(item =>
                item.root_cause &&
                rc &&
                normalizeText(item.root_cause) ===
                normalizeText(rc.text)
            )?.solution || "";

    const verification =
        (aiCopilotContext.results || [])
            .find(item => item.verification)
            ?.verification || "";

    const box = $("v1LearningPanel");

    if (!box) return;

    box.innerHTML = `
        <div class="v1-panel-title">
            <span>💡 Module 6 — Knowledge Learning</span>
            <span class="v1-badge">HUMAN APPROVAL</span>
        </div>

        <p class="v1-learning-note">
            ตรวจสอบข้อมูลก่อนบันทึก เพราะ Knowledge ใหม่จะถูกนำไปใช้
            เป็นหลักฐานใน Case ถัดไป
        </p>

        <label>Title</label>
        <input id="learnTitle"
            value="${escapeHtml(
                `Resolution: ${ticket.problem || ticket.ticket_no || "IT Case"}`
            )}">

        <label>Category</label>
        <input id="learnCategory"
            value="${escapeHtml(ticket.system_type || "")}">

        <label>Symptom</label>
        <textarea id="learnSymptom">${escapeHtml(
            ticket.problem || ""
        )}</textarea>

        <label>Environment</label>
        <textarea id="learnEnvironment">${escapeHtml(
            [
                ticket.user_name,
                ticket.system_type,
                ticket.priority ? `Priority: ${ticket.priority}` : ""
            ].filter(Boolean).join(" | ")
        )}</textarea>

        <label>Root Cause</label>
        <textarea id="learnRootCause">${escapeHtml(
            rc?.text || ""
        )}</textarea>

        <label>Solution</label>
        <textarea id="learnSolution">${escapeHtml(
            solution
        )}</textarea>

        <label>Verification</label>
        <textarea id="learnVerification">${escapeHtml(
            verification
        )}</textarea>

        <button
            type="button"
            class="v1-action-btn success"
            id="confirmSaveKnowledgeBtn"
        >
            ✅ Approve & Save Knowledge
        </button>

        <div id="learningSaveStatus"></div>
    `;

    $("confirmSaveKnowledgeBtn")
        ?.addEventListener(
            "click",
            saveKnowledgeV1
        );
}

async function saveKnowledgeV1() {

    const title = $("learnTitle")?.value.trim();
    const category = $("learnCategory")?.value.trim();
    const symptom = $("learnSymptom")?.value.trim();
    const environment = $("learnEnvironment")?.value.trim();
    const rootCause = $("learnRootCause")?.value.trim();
    const solution = $("learnSolution")?.value.trim();
    const verification = $("learnVerification")?.value.trim();

    if (!title || !symptom) {
        showToast("ต้องมี Title และ Symptom");
        return;
    }

    const status = $("learningSaveStatus");

    if (status) {
        status.innerHTML = "⏳ กำลังบันทึก Knowledge...";
    }

    try {

        const { data, error } = await supabaseClient
            .from("knowledge_base")
            .insert({
                title,
                category: category || null,
                symptom: symptom || null,
                environment: environment || null,
                root_cause: rootCause || null,
                solution: solution || null,
                verification: verification || null
            })
            .select(
                "id,title,category,symptom,environment,root_cause,solution,verification"
            )
            .single();

        if (error) throw error;

        if (status) {
            status.innerHTML = `
                <div class="v1-success">
                    ✅ Saved Knowledge #${escapeHtml(data.id)}
                    <br>
                    <small>
                        Knowledge ถูกเพิ่มเข้า Knowledge Base แล้ว
                    </small>
                </div>
            `;
        }

        showToast("บันทึก Knowledge สำเร็จ");

    } catch (error) {

        console.error(
            "Knowledge Learning Error:",
            error
        );

        if (status) {
            status.innerHTML = `
                <div class="v1-error">
                    ❌ บันทึกไม่สำเร็จ:
                    ${escapeHtml(error.message || "")}
                </div>
            `;
        }
    }
}

/* =========================================================
   MODULE PANEL RENDERING
   ========================================================= */

function renderEmptyAIPanels() {

    return `
        <div class="v1-ai-panels">
            <div class="v1-panel" id="v1RootCausePanel">
                <div class="v1-panel-title">
                    <span>🧠 Module 4 — Root Cause Analysis</span>
                </div>
                <div class="v1-panel-empty">
                    ค้นหา Similar Case ก่อน
                </div>
            </div>

            <div class="v1-panel" id="v1TroubleshootingPanel">
                <div class="v1-panel-title">
                    <span>🛠️ Module 5 — Troubleshooting</span>
                </div>
                <div class="v1-panel-empty">
                    รอผล Root Cause Analysis
                </div>
            </div>

            <div class="v1-panel" id="v1LearningPanel">
                <div class="v1-panel-title">
                    <span>💡 Module 6 — Knowledge Learning</span>
                </div>
                <div class="v1-panel-empty">
                    เมื่อแก้ Case เสร็จ สามารถสร้าง Knowledge ใหม่ได้
                </div>
            </div>
        </div>
    `;
}

function renderAICopilotPanels(results) {

    return `
        <div class="v1-ai-actions">

            <div class="v1-panel" id="v1RootCausePanel">
                <div class="v1-panel-title">
                    <span>🧠 Module 4 — Root Cause Analysis</span>
                    <span class="v1-badge">READY</span>
                </div>

                <div class="v1-panel-empty">
                    พบ ${results.length} Similar Case
                    <br>
                    กดปุ่มเพื่อวิเคราะห์ Root Cause จาก Evidence
                </div>

                <button
                    type="button"
                    class="v1-action-btn"
                    id="analyzeRootCauseBtn"
                >
                    🧠 Analyze Root Cause
                </button>
            </div>

            <div class="v1-panel" id="v1TroubleshootingPanel">
                <div class="v1-panel-title">
                    <span>🛠️ Module 5 — Troubleshooting</span>
                    <span class="v1-badge">WAITING</span>
                </div>

                <div class="v1-panel-empty">
                    ต้องผ่าน Root Cause Analysis ก่อน
                </div>
            </div>

            <div class="v1-panel" id="v1LearningPanel">
                <div class="v1-panel-title">
                    <span>💡 Module 6 — Knowledge Learning</span>
                    <span class="v1-badge">WAITING</span>
                </div>

                <div class="v1-panel-empty">
                    หลัง Verify ผลการแก้ไข สามารถบันทึกเป็น Knowledge ใหม่
                </div>
            </div>
        </div>
    `;

}

/*
 * Attach lightweight V1 styling from JavaScript so Modules 4-6
 * do not require another file just to become usable.
 */
function injectV1Styles() {

    if ($("v1RuntimeStyles")) return;

    const style = document.createElement("style");
    style.id = "v1RuntimeStyles";

    style.textContent = `
        .v1-search-header {
            display:flex;
            justify-content:space-between;
            gap:16px;
            align-items:center;
            padding:14px 16px;
            margin-bottom:12px;
            background:#f5f8ff;
            border:1px solid #dce6f7;
            border-radius:12px;
        }

        .v1-search-header small {
            display:block;
            margin-top:4px;
            color:#64748b;
        }

        .v1-search-header > span {
            font-size:12px;
            font-weight:700;
            color:#2563eb;
        }

        .v1-ai-panels {
            display:grid;
            gap:14px;
            margin-top:16px;
        }

        .v1-panel {
            padding:16px;
            border:1px solid #dbe4f0;
            border-radius:14px;
            background:#fff;
            box-shadow:0 2px 8px rgba(15,23,42,.04);
        }

        .v1-panel-title {
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:12px;
            margin-bottom:12px;
            font-weight:800;
        }

        .v1-badge {
            font-size:10px;
            padding:4px 8px;
            border-radius:999px;
            background:#e8f0ff;
            color:#2563eb;
            letter-spacing:.04em;
        }

        .v1-panel-empty {
            padding:14px;
            border-radius:10px;
            background:#f8fafc;
            color:#64748b;
        }

        .v1-action-btn {
            width:100%;
            margin-top:14px;
            padding:11px 14px;
            border:0;
            border-radius:10px;
            background:#2563eb;
            color:#fff;
            font-weight:700;
            cursor:pointer;
        }

        .v1-action-btn:hover {
            filter:brightness(.95);
        }

        .v1-action-btn.success {
            background:#16a34a;
        }

        .v1-root-cause-main {
            display:flex;
            justify-content:space-between;
            gap:20px;
            padding:14px;
            border-radius:12px;
            background:#f8fafc;
        }

        .v1-root-cause-main small,
        .v1-root-cause-main strong {
            display:block;
        }

        .v1-root-cause-main strong {
            margin-top:6px;
            font-size:16px;
        }

        .v1-confidence {
            min-width:90px;
            text-align:center;
            padding:8px;
            border-radius:10px;
            background:#ecfdf5;
            color:#15803d;
        }

        .v1-confidence b,
        .v1-confidence small {
            display:block;
        }

        .v1-confidence b {
            font-size:22px;
        }

        .v1-evidence {
            margin-top:10px;
            font-size:13px;
            color:#475569;
        }

        .v1-details {
            margin-top:10px;
            font-size:13px;
        }

        .v1-step-list {
            display:grid;
            gap:10px;
        }

        .v1-step {
            display:grid;
            grid-template-columns:34px 1fr auto;
            gap:12px;
            align-items:start;
            padding:12px;
            border:1px solid #e2e8f0;
            border-radius:10px;
        }

        .v1-step-number {
            width:30px;
            height:30px;
            display:grid;
            place-items:center;
            border-radius:50%;
            background:#e8f0ff;
            color:#2563eb;
            font-weight:800;
        }

        .v1-step-content strong {
            display:block;
            margin-bottom:4px;
        }

        .v1-step-content p {
            margin:0 0 5px;
        }

        .v1-step-content small {
            color:#64748b;
        }

        .v1-step-status {
            font-size:10px;
            font-weight:800;
            color:#64748b;
            padding:5px 7px;
            border-radius:999px;
            background:#f1f5f9;
        }

        .v1-learning-note {
            color:#64748b;
            font-size:13px;
        }

        .v1-panel label {
            display:block;
            margin:10px 0 5px;
            font-size:12px;
            font-weight:700;
        }

        .v1-panel input,
        .v1-panel textarea {
            width:100%;
            box-sizing:border-box;
            padding:9px 10px;
            border:1px solid #cbd5e1;
            border-radius:8px;
            font:inherit;
            background:#fff;
        }

        .v1-panel textarea {
            min-height:70px;
            resize:vertical;
        }

        .v1-success {
            margin-top:10px;
            padding:10px;
            border-radius:8px;
            background:#ecfdf5;
            color:#166534;
        }

        .v1-error {
            margin-top:10px;
            padding:10px;
            border-radius:8px;
            background:#fef2f2;
            color:#b91c1c;
        }

        @media (max-width:700px) {
            .v1-root-cause-main {
                flex-direction:column;
            }

            .v1-step {
                grid-template-columns:34px 1fr;
            }

            .v1-step-status {
                grid-column:2;
                width:max-content;
            }
        }
    `;

    document.head.appendChild(style);
}

/*
 * Re-bind the V1 runtime after the existing page has loaded.
 */
document.addEventListener("DOMContentLoaded", () => {
    injectV1Styles();
});
