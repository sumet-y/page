/* =====================================================
   AI IT SUPPORT COPILOT
   PHASE 3.1

   Knowledge Retrieval / Similar Case Search

   Phase 2.3
   - Create Ticket
   - Ticket List
   - Search
   - Status
   - Solution
   - Knowledge Base

   Phase 3.1
   - Search Knowledge Base
   - Keyword Ranking
   - Similar Case
===================================================== */


/* =====================================================
   1. SUPABASE CONFIG
===================================================== */

const SUPABASE_URL =
    "https://cpdakjvwsvtottatulwo.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "วาง_sb_publishable_key_ของคุณตรงนี้";


/* =====================================================
   2. SUPABASE CLIENT
===================================================== */

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );


/* =====================================================
   3. GLOBAL VARIABLES
===================================================== */

let allTickets = [];

let currentTicket = null;

let currentSolution = null;


/* =====================================================
   4. COMMON HELPERS
===================================================== */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;
}



function generateTicketNumber() {

    return (
        "INC-" +
        Date.now()
            .toString()
            .slice(-8)
    );

}



function setDetailMessage(
    message,
    type = "normal"
) {

    const element =
        document.getElementById(
            "detailStatusMessage"
        );

    if (!element) {
        return;
    }

    element.innerHTML =
        message;

    if (type === "success") {

        element.style.borderLeft =
            "4px solid #16a34a";

    }

    if (type === "error") {

        element.style.borderLeft =
            "4px solid #dc2626";

    }

}


/* =====================================================
   5. PAGE START
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadTickets();

    }
);


/* =====================================================
   6. CREATE TICKET
===================================================== */

async function createTicket() {

    const userName =
        document
            .getElementById("userName")
            .value
            .trim();


    const systemType =
        document
            .getElementById("systemType")
            .value;


    const problem =
        document
            .getElementById("problem")
            .value
            .trim();


    const priority =
        document
            .getElementById("priority")
            .value;


    const button =
        document
            .getElementById(
                "createTicketButton"
            );


    if (!userName) {

        alert(
            "กรุณากรอกชื่อผู้แจ้ง"
        );

        return;

    }


    if (!problem) {

        alert(
            "กรุณากรอกรายละเอียดปัญหา"
        );

        return;

    }


    button.disabled =
        true;

    button.innerHTML =
        "⏳ กำลังบันทึก...";


    try {

        const ticketNo =
            generateTicketNumber();


        const {
            data,
            error
        } = await supabaseClient

            .from("tickets")

            .insert({

                ticket_no:
                    ticketNo,

                user_name:
                    userName,

                system_type:
                    systemType,

                problem:
                    problem,

                status:
                    "Open",

                priority:
                    priority

            })

            .select()

            .single();


        if (error) {

            throw error;

        }


        alert(
            "✅ สร้าง Ticket สำเร็จ\n\n" +
            ticketNo
        );


        document
            .getElementById("userName")
            .value = "";


        document
            .getElementById("problem")
            .value = "";


        await loadTickets();


        openTicket(
            data.id
        );


    }

    catch (error) {

        console.error(
            "Create Ticket Error:",
            error
        );


        alert(
            "❌ ไม่สามารถสร้าง Ticket ได้\n\n" +
            error.message
        );

    }

    finally {

        button.disabled =
            false;

        button.innerHTML =
            "🎫 Create Ticket";

    }

}


/* =====================================================
   7. LOAD TICKETS
===================================================== */

async function loadTickets() {

    const container =
        document.getElementById(
            "ticketList"
        );


    container.innerHTML = `

        <div class="empty">

            ⏳

            <p>
                Loading tickets...
            </p>

        </div>

    `;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("tickets")

            .select("*")

            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            throw error;

        }


        allTickets =
            data || [];


        updateDashboard();


        renderTickets(
            allTickets
        );

    }

    catch (error) {

        console.error(
            "Load Tickets Error:",
            error
        );


        container.innerHTML = `

            <div class="ai-box warning">

                ❌ ไม่สามารถโหลด Ticket ได้

                <p>

                    ${escapeHtml(
                        error.message
                    )}

                </p>

            </div>

        `;

    }

}


/* =====================================================
   8. DASHBOARD
===================================================== */

function updateDashboard() {

    const total =
        allTickets.length;


    const open =
        allTickets.filter(
            ticket =>
                ticket.status === "Open"
        ).length;


    const progress =
        allTickets.filter(
            ticket =>
                ticket.status === "In Progress"
        ).length;


    const resolved =
        allTickets.filter(
            ticket =>
                ticket.status === "Resolved" ||
                ticket.status === "Closed"
        ).length;


    document
        .getElementById(
            "totalTickets"
        )
        .textContent =
        total;


    document
        .getElementById(
            "openTickets"
        )
        .textContent =
        open;


    document
        .getElementById(
            "progressTickets"
        )
        .textContent =
        progress;


    document
        .getElementById(
            "resolvedTickets"
        )
        .textContent =
        resolved;

}


/* =====================================================
   9. RENDER TICKETS
===================================================== */

function renderTickets(
    tickets
) {

    const container =
        document.getElementById(
            "ticketList"
        );


    if (!tickets.length) {

        container.innerHTML = `

            <div class="empty">

                📭

                <h3>
                    ไม่พบ Ticket
                </h3>

            </div>

        `;

        return;

    }


    container.innerHTML =
        tickets.map(
            ticket => {

                return `

                    <div
                        class="ticket-row"
                        onclick="openTicket(${ticket.id})"
                    >

                        <div>

                            <strong>

                                ${escapeHtml(
                                    ticket.ticket_no
                                )}

                            </strong>


                            <div class="ticket-meta">

                                ${escapeHtml(
                                    ticket.user_name
                                )}

                                ·

                                ${escapeHtml(
                                    ticket.system_type
                                )}

                            </div>

                        </div>


                        <div class="ticket-problem">

                            ${escapeHtml(
                                ticket.problem
                            )}

                        </div>


                        <div>

                            <span
                                class="status-badge
                                ${getStatusClass(
                                    ticket.status
                                )}"
                            >

                                ${escapeHtml(
                                    ticket.status
                                )}

                            </span>

                        </div>


                        <div>

                            <span
                                class="priority-badge
                                ${getPriorityClass(
                                    ticket.priority
                                )}"
                            >

                                ${escapeHtml(
                                    ticket.priority
                                )}

                            </span>

                        </div>

                    </div>

                `;

            }
        ).join("");

}


/* =====================================================
   10. STATUS CLASS
===================================================== */

function getStatusClass(
    status
) {

    switch (status) {

        case "Open":
            return "status-open";

        case "In Progress":
            return "status-progress";

        case "Resolved":
            return "status-resolved";

        case "Closed":
            return "status-closed";

        default:
            return "";

    }

}


/* =====================================================
   11. PRIORITY CLASS
===================================================== */

function getPriorityClass(
    priority
) {

    switch (priority) {

        case "Critical":
            return "priority-critical";

        case "High":
            return "priority-high";

        case "Medium":
            return "priority-medium";

        case "Low":
            return "priority-low";

        default:
            return "";

    }

}


/* =====================================================
   12. FILTER TICKETS
===================================================== */

function filterTickets() {

    const search =
        document
            .getElementById(
                "searchTicket"
            )
            .value
            .toLowerCase()
            .trim();


    const status =
        document
            .getElementById(
                "statusFilter"
            )
            .value;


    const filtered =
        allTickets.filter(
            ticket => {

                const text = (

                    ticket.ticket_no +
                    " " +
                    ticket.user_name +
                    " " +
                    ticket.system_type +
                    " " +
                    ticket.problem

                ).toLowerCase();


                const matchSearch =
                    !search ||
                    text.includes(
                        search
                    );


                const matchStatus =
                    status === "All" ||
                    ticket.status === status;


                return (
                    matchSearch &&
                    matchStatus
                );

            }
        );


    renderTickets(
        filtered
    );

}


/* =====================================================
   13. OPEN TICKET
===================================================== */

async function openTicket(
    ticketId
) {

    const ticket =
        allTickets.find(
            item =>
                Number(item.id) ===
                Number(ticketId)
        );


    if (!ticket) {

        alert(
            "ไม่พบ Ticket"
        );

        return;

    }


    currentTicket =
        ticket;


    const section =
        document.getElementById(
            "ticketDetailSection"
        );


    section.style.display =
        "block";


    section.scrollIntoView({

        behavior: "smooth"

    });


    document
        .getElementById(
            "detailStatus"
        )
        .value =
        ticket.status;


    document
        .getElementById(
            "ticketDetail"
        )
        .innerHTML = `

            <div class="ticket-detail">

                <h3>

                    🎫

                    ${escapeHtml(
                        ticket.ticket_no
                    )}

                </h3>


                <p>

                    <b>
                        ผู้แจ้ง:
                    </b>

                    ${escapeHtml(
                        ticket.user_name
                    )}

                </p>


                <p>

                    <b>
                        ระบบ:
                    </b>

                    ${escapeHtml(
                        ticket.system_type
                    )}

                </p>


                <p>

                    <b>
                        Priority:
                    </b>

                    ${escapeHtml(
                        ticket.priority
                    )}

                </p>


                <p>

                    <b>
                        Status:
                    </b>

                    ${escapeHtml(
                        ticket.status
                    )}

                </p>


                <div class="problem-box">

                    <b>
                        Problem
                    </b>

                    <p>

                        ${escapeHtml(
                            ticket.problem
                        )}

                    </p>

                </div>

            </div>

        `;


    await loadSolution(
        ticket.id
    );

}


/* =====================================================
   14. LOAD SOLUTION
===================================================== */

async function loadSolution(
    ticketId
) {

    currentSolution =
        null;


    document
        .getElementById(
            "rootCause"
        )
        .value = "";


    document
        .getElementById(
            "evidence"
        )
        .value = "";


    document
        .getElementById(
            "solution"
        )
        .value = "";


    document
        .getElementById(
            "verification"
        )
        .value = "";


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("solutions")

            .select("*")

            .eq(
                "ticket_id",
                ticketId
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            )

            .limit(1);


        if (error) {

            throw error;

        }


        if (
            data &&
            data.length
        ) {

            currentSolution =
                data[0];


            document
                .getElementById(
                    "rootCause"
                )
                .value =
                data[0].root_cause || "";


            document
                .getElementById(
                    "evidence"
                )
                .value =
                data[0].evidence || "";


            document
                .getElementById(
                    "solution"
                )
                .value =
                data[0].solution || "";


            document
                .getElementById(
                    "verification"
                )
                .value =
                data[0].verification || "";


            setDetailMessage(
                "📝 โหลด Solution เดิมแล้ว"
            );

        }

        else {

            setDetailMessage(
                "🆕 Ticket นี้ยังไม่มี Solution"
            );

        }

    }

    catch (error) {

        console.error(
            "Load Solution Error:",
            error
        );

    }

}


/* =====================================================
   15. SAVE SOLUTION
===================================================== */

async function saveSolution() {

    if (!currentTicket) {

        alert(
            "กรุณาเลือก Ticket ก่อน"
        );

        return;

    }


    const rootCause =
        document
            .getElementById(
                "rootCause"
            )
            .value
            .trim();


    const evidence =
        document
            .getElementById(
                "evidence"
            )
            .value
            .trim();


    const solution =
        document
            .getElementById(
                "solution"
            )
            .value
            .trim();


    const verification =
        document
            .getElementById(
                "verification"
            )
            .value
            .trim();


    const status =
        document
            .getElementById(
                "detailStatus"
            )
            .value;


    if (!rootCause) {

        alert(
            "กรุณากรอก Root Cause"
        );

        return;

    }


    if (!solution) {

        alert(
            "กรุณากรอก Solution"
        );

        return;

    }


    try {

        const {
            data: existing,
            error: findError
        } = await supabaseClient

            .from("solutions")

            .select("id")

            .eq(
                "ticket_id",
                currentTicket.id
            )

            .order(
                "created_at",
                {
                    ascending: false
                }
            )

            .limit(1);


        if (findError) {

            throw findError;

        }


        let solutionData;


        if (
            existing &&
            existing.length
        ) {

            const {
                data,
                error
            } = await supabaseClient

                .from("solutions")

                .update({

                    root_cause:
                        rootCause,

                    evidence:
                        evidence,

                    solution:
                        solution,

                    verification:
                        verification

                })

                .eq(
                    "id",
                    existing[0].id
                )

                .select()
                .single();


            if (error) {

                throw error;

            }


            solutionData =
                data;

        }

        else {

            const {
                data,
                error
            } = await supabaseClient

                .from("solutions")

                .insert({

                    ticket_id:
                        currentTicket.id,

                    root_cause:
                        rootCause,

                    evidence:
                        evidence,

                    solution:
                        solution,

                    verification:
                        verification

                })

                .select()
                .single();


            if (error) {

                throw error;

            }


            solutionData =
                data;

        }


        currentSolution =
            solutionData;


        const {
            error: ticketError
        } = await supabaseClient

            .from("tickets")

            .update({

                status:
                    status

            })

            .eq(
                "id",
                currentTicket.id
            );


        if (ticketError) {

            throw ticketError;

        }


        currentTicket.status =
            status;


        setDetailMessage(
            "✅ บันทึก Solution สำเร็จ",
            "success"
        );


        await loadTickets();


    }

    catch (error) {

        console.error(
            "Save Solution Error:",
            error
        );


        setDetailMessage(
            "❌ บันทึกไม่สำเร็จ: " +
            error.message,
            "error"
        );

    }

}


/* =====================================================
   16. SAVE TO KNOWLEDGE BASE
===================================================== */

async function saveToKnowledgeBase() {

    if (!currentTicket) {

        alert(
            "กรุณาเลือก Ticket ก่อน"
        );

        return;

    }


    const rootCause =
        document
            .getElementById(
                "rootCause"
            )
            .value
            .trim();


    const evidence =
        document
            .getElementById(
                "evidence"
            )
            .value
            .trim();


    const solution =
        document
            .getElementById(
                "solution"
            )
            .value
            .trim();


    const verification =
        document
            .getElementById(
                "verification"
            )
            .value
            .trim();


    if (!rootCause) {

        alert(
            "กรุณากรอก Root Cause ก่อน"
        );

        return;

    }


    if (!solution) {

        alert(
            "กรุณากรอก Solution ก่อน"
        );

        return;

    }


    if (!verification) {

        alert(
            "กรุณากรอก Verification ก่อน"
        );

        return;

    }


    if (
        !confirm(
            "ต้องการบันทึก Case นี้เข้า Knowledge Base หรือไม่?"
        )
    ) {

        return;

    }


    try {

        const title =

            currentTicket.system_type +
            " - " +
            currentTicket.problem
                .substring(
                    0,
                    80
                );


        const {
            data,
            error
        } = await supabaseClient

            .from("knowledge_base")

            .insert({

                title:
                    title,

                category:
                    currentTicket.system_type,

                symptom:
                    currentTicket.problem,

                environment:
                    currentTicket.user_name,

                root_cause:
                    rootCause,

                solution:
                    solution,

                verification:
                    verification

            })

            .select()
            .single();


        if (error) {

            throw error;

        }


        setDetailMessage(
            "🧠 บันทึก Knowledge Base สำเร็จ",
            "success"
        );


        alert(
            "🧠 Knowledge Base Saved\n\n" +
            "KB ID: " +
            data.id
        );

    }

    catch (error) {

        console.error(
            "Save KB Error:",
            error
        );


        setDetailMessage(
            "❌ บันทึก Knowledge Base ไม่สำเร็จ: " +
            error.message,
            "error"
        );

    }

}


/* =====================================================
   17. PHASE 3.1
   KNOWLEDGE BASE SEARCH
===================================================== */


/*
    ตัดคำสำหรับ Search

    ตอนนี้เราใช้วิธีง่ายก่อน:

    - แยกคำ
    - ตัดคำที่สั้นเกินไป
    - เอาคำซ้ำออก

    Phase 3.2 จะเปลี่ยนเป็น
    Embedding / Semantic Search
*/


function tokenize(
    text
) {

    if (!text) {
        return [];
    }


    return text

        .toLowerCase()

        .replace(
            /[^\p{L}\p{N}\s+#.-]/gu,
            " "
        )

        .split(/\s+/)

        .map(
            word =>
                word.trim()
        )

        .filter(
            word =>
                word.length >= 2
        );

}


/*
    Stop Words

    ลดคำทั่วไปที่ไม่ช่วยในการ Search
*/

const STOP_WORDS = new Set([

    "และ",
    "หรือ",
    "ของ",
    "ที่",
    "เป็น",
    "มี",
    "ใน",
    "จาก",
    "แล้ว",
    "ให้",
    "กับ",
    "ว่า",
    "ได้",
    "การ",
    "โดย",
    "this",
    "that",
    "with",
    "from",
    "the",
    "and",
    "for"

]);


/*
    ทำความสะอาด Token
*/

function cleanTokens(
    text
) {

    return tokenize(text)

        .filter(
            token =>
                !STOP_WORDS.has(
                    token
                )
        );

}


/*
    คำนวณคะแนน Match

    คะแนนสูง =
    มีคำที่ตรงกันมาก

*/

function calculateKnowledgeScore(
    queryText,
    knowledge
) {

    const queryTokens =
        cleanTokens(
            queryText
        );


    if (!queryTokens.length) {

        return 0;

    }


    const knowledgeText = (

        (knowledge.title || "") +
        " " +
        (knowledge.category || "") +
        " " +
        (knowledge.symptom || "") +
        " " +
        (knowledge.environment || "") +
        " " +
        (knowledge.root_cause || "") +
        " " +
        (knowledge.solution || "") +
        " " +
        (knowledge.verification || "")

    );


    const knowledgeTokens =
        cleanTokens(
            knowledgeText
        );


    const knowledgeSet =
        new Set(
            knowledgeTokens
        );


    let matched = 0;


    for (
        const token of queryTokens
    ) {

        if (
            knowledgeSet.has(
                token
            )
        ) {

            matched++;

        }

    }


    let score =
        (
            matched /
            queryTokens.length
        ) * 100;


    /*
        Category/System match
        เพิ่มน้ำหนักเล็กน้อย
    */

    const system =
        currentTicket
            ?.system_type
            ?.toLowerCase() || "";


    const category =
        knowledge
            .category
            ?.toLowerCase() || "";


    if (
        system &&
        category &&
        system === category
    ) {

        score += 15;

    }


    return Math.min(
        Math.round(score),
        100
    );

}


/* =====================================================
   18. SEARCH KNOWLEDGE BASE
===================================================== */

async function searchKnowledge() {

    if (!currentTicket) {

        alert(
            "กรุณาเลือก Ticket ก่อน"
        );

        return;

    }


    const button =
        document.getElementById(
            "knowledgeSearchButton"
        );


    const status =
        document.getElementById(
            "knowledgeSearchStatus"
        );


    const results =
        document.getElementById(
            "knowledgeResults"
        );


    button.disabled =
        true;


    button.innerHTML =
        "⏳ กำลังค้นหา...";


    status.innerHTML =
        "🔎 กำลังค้นหา Knowledge Base...";


    results.innerHTML =
        "";


    try {


        /*
            ดึงเฉพาะ Knowledge ที่จำเป็น

            ไม่ใช้ secret key
        */

        const {
            data,
            error
        } = await supabaseClient

            .from("knowledge_base")

            .select(
                "id,title,category,symptom,environment,root_cause,solution,verification"
            );


        if (error) {

            throw error;

        }


        const knowledgeBase =
            data || [];


        if (!knowledgeBase.length) {

            status.innerHTML =
                "📭 Knowledge Base ยังไม่มีข้อมูล";


            results.innerHTML = `

                <div class="ai-box">

                    <h3>
                        ยังไม่มี Case สำหรับค้นหา
                    </h3>

                    <p>

                        เมื่อ IT แก้ Ticket สำเร็จ
                        ให้กด

                        <b>
                            Save to Knowledge Base
                        </b>

                        เพื่อสร้าง Memory ให้ระบบ

                    </p>

                </div>

            `;

            return;

        }


        /*
            สร้าง Query จาก Ticket
        */

        const queryText = (

            currentTicket.system_type +
            " " +
            currentTicket.problem

        );


        /*
            คำนวณคะแนนทุก Case
        */

        const scored =
            knowledgeBase

                .map(
                    item => ({

                        ...item,

                        matchScore:
                            calculateKnowledgeScore(
                                queryText,
                                item
                            )

                    })
                )

                .filter(
                    item =>
                        item.matchScore > 0
                )

                .sort(
                    (
                        a,
                        b
                    ) =>
                        b.matchScore -
                        a.matchScore
                )

                .slice(
                    0,
                    3
                );


        if (!scored.length) {

            status.innerHTML =
                "🔍 ไม่พบ Case ที่มีคำตรงกัน";


            results.innerHTML = `

                <div class="ai-box">

                    <h3>
                        ไม่พบ Similar Case
                    </h3>

                    <p>

                        ลองใช้คำอธิบายปัญหา
                        ที่ละเอียดขึ้น

                    </p>

                    <p>

                        หรือให้ IT แก้ Case นี้
                        แล้วบันทึกเข้า Knowledge Base

                    </p>

                </div>

            `;

            return;

        }


        /*
            แสดงผล
        */

        status.innerHTML =

            "🧠 พบ " +
            scored.length +
            " Similar Case";


        results.innerHTML = `

            <div>

                <h3>

                    🔎 Similar Cases

                </h3>

                <p>

                    ระบบจัดอันดับจาก
                    Keyword Match
                    และ System Category

                </p>

            </div>

            ${

                scored
                    .map(
                        (
                            item,
                            index
                        ) => {

                            return `

                                <div
                                    class="ai-box"
                                    style="
                                        margin-top:12px;
                                    "
                                >

                                    <div
                                        style="
                                            display:flex;
                                            justify-content:space-between;
                                            gap:10px;
                                        "
                                    >

                                        <h3>

                                            #${index + 1}

                                            ${escapeHtml(
                                                item.title
                                            )}

                                        </h3>


                                        <strong>

                                            ${item.matchScore}%

                                        </strong>

                                    </div>


                                    <hr>


                                    <p>

                                        <b>
                                            Category:
                                        </b>

                                        ${escapeHtml(
                                            item.category
                                        )}

                                    </p>


                                    <p>

                                        <b>
                                            Symptom:
                                        </b>

                                        ${escapeHtml(
                                            item.symptom
                                        )}

                                    </p>


                                    <p>

                                        <b>
                                            Root Cause:
                                        </b>

                                        ${escapeHtml(
                                            item.root_cause
                                        )}

                                    </p>


                                    <p>

                                        <b>
                                            Solution:
                                        </b>

                                        ${escapeHtml(
                                            item.solution
                                        )}

                                    </p>


                                    <p>

                                        <b>
                                            Verification:
                                        </b>

                                        ${escapeHtml(
                                            item.verification
                                        )}

                                    </p>


                                    <small>

                                        KB ID:

                                        ${escapeHtml(
                                            item.id
                                        )}

                                    </small>


                                </div>

                            `;

                        }
                    )
                    .join("")

            }

        `;


    }

    catch (error) {

        console.error(
            "Knowledge Search Error:",
            error
        );


        status.innerHTML =
            "❌ Knowledge Search Error";


        results.innerHTML = `

            <div class="ai-box warning">

                <h3>
                    ❌ ค้น Knowledge Base ไม่สำเร็จ
                </h3>

                <p>

                    ${escapeHtml(
                        error.message
                    )}

                </p>

            </div>

        `;

    }

    finally {

        button.disabled =
            false;

        button.innerHTML =
            "🔎 ค้นหา Case ที่ใกล้เคียง";

    }

}


/* =====================================================
   19. DATABASE TEST
===================================================== */

async function testDatabase() {

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("tickets")

            .select("id")

            .limit(1);


        if (error) {

            console.error(
                "Database Test FAILED:",
                error
            );

            return false;

        }


        console.log(
            "Database Test SUCCESS:",
            data
        );


        return true;

    }

    catch (error) {

        console.error(
            "Database Test ERROR:",
            error
        );

        return false;

    }

}
