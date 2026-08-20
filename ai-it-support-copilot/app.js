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

async function searchKnowledge() {

    const query =
        (
            $("knowledgeQuery")
                ?.value || ""
        )
        .trim();


    if (!query) {

        showToast(
            "กรุณาระบุข้อความที่ต้องการค้นหา"
        );

        return;

    }


    $("knowledgeStatus")
        .textContent =
        "🔎 กำลังค้นหา Knowledge Base...";


    $("knowledgeResults")
        .innerHTML = `

        <div class="knowledge-empty">

            🔎 Searching...

        </div>

    `;


    try {

        /*
         * Current V2 keeps compatibility
         * with the existing Phase 3.1
         * keyword/category search.
         *
         * Semantic Vector Search will replace
         * this function in Module 3 backend.
         */


        const {
            data,
            error
        } =
        await supabaseClient
            .from(
                "knowledge_base"
            )
            .select(
                "id,title,category,symptom,environment,root_cause,solution,verification"
            );


        if (error) {

            throw error;

        }


        const results =
            rankKnowledge(
                query,
                data || []
            );


        renderKnowledgeResults(
            results
        );


    } catch (error) {

        console.error(
            "Knowledge Search Error:",
            error
        );


        $("knowledgeStatus")
            .textContent =
            "❌ Search Error";


        $("knowledgeResults")
            .innerHTML = `

            <div class="knowledge-empty">

                ❌ ไม่สามารถค้นหา Knowledge Base ได้

                <br><br>

                ${escapeHtml(
                    error.message || ""
                )}

            </div>

        `;

    }

}


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
