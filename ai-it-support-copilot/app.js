/* =====================================================
   AI IT SUPPORT COPILOT
   PHASE 2.3

   Ticket Management

   GitHub Pages
        ↓
   Supabase
        ↓
   PostgreSQL

   Features:

   1. Create Ticket
   2. Ticket List
   3. Search
   4. Status Filter
   5. Ticket Detail
   6. Save Solution
   7. Update Status
   8. Save to Knowledge Base
===================================================== */



/* =====================================================
   1. SUPABASE CONFIG
===================================================== */

const SUPABASE_URL =
    "https://cpdakjvwsvtottatulwo.supabase.co";


const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_XM-TOIhVRRMqtPCQpIsX8A_XECc2BEv";


/* =====================================================
   2. CREATE CLIENT
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
   4. HELPERS
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



        /* Clear Form */

        document
            .getElementById("userName")
            .value = "";


        document
            .getElementById("problem")
            .value = "";



        /* Reload List */

        await loadTickets();



        /* Open new ticket */

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
   9. RENDER TICKET LIST
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

                <p>
                    ลองเปลี่ยนคำค้นหา
                    หรือสร้าง Ticket ใหม่
                </p>

            </div>

        `;

        return;

    }



    container.innerHTML =
        tickets.map(
            ticket => {


                const statusClass =
                    getStatusClass(
                        ticket.status
                    );


                const priorityClass =
                    getPriorityClass(
                        ticket.priority
                    );


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
                                class="status-badge ${statusClass}"
                            >

                                ${escapeHtml(
                                    ticket.status
                                )}

                            </span>

                        </div>


                        <div>

                            <span
                                class="priority-badge ${priorityClass}"
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
   12. SEARCH / FILTER
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
   13. OPEN TICKET DETAIL
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


                <p>

                    <small>

                        Created:

                        ${escapeHtml(
                            ticket.created_at
                        )}

                    </small>

                </p>

            </div>

        `;



    /* Load existing solution */

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


        setDetailMessage(
            "⚠️ โหลด Solution ไม่สำเร็จ: " +
            error.message,
            "error"
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


        /* ---------------------------------------------
           Check existing solution
        ---------------------------------------------- */

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



        /* ---------------------------------------------
           UPDATE EXISTING
        ---------------------------------------------- */

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



        /* ---------------------------------------------
           INSERT NEW
        ---------------------------------------------- */

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



        /* ---------------------------------------------
           Update Ticket Status
        ---------------------------------------------- */

        const {

            error:
                ticketError

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
            "✅ บันทึก Solution และ Status สำเร็จ",
            "success"
        );



        await loadTickets();


        await openTicket(
            currentTicket.id
        );


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



    /* ---------------------------------------------
       Validation
    ---------------------------------------------- */

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



    /* ---------------------------------------------
       Confirm
    ---------------------------------------------- */

    const confirmed =
        confirm(

            "ต้องการบันทึก Case นี้เข้า Knowledge Base หรือไม่?\n\n" +

            "Ticket: " +
            currentTicket.ticket_no +
            "\n\n" +

            "ควรบันทึกเฉพาะ Solution ที่ IT ตรวจสอบแล้วเท่านั้น."

        );



    if (!confirmed) {

        return;

    }



    try {


        const title =

            currentTicket.system_type +
            " - " +
            currentTicket.problem
                .substring(0, 80);



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
            "🧠 บันทึก Case เข้า Knowledge Base สำเร็จ",
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
            "Save Knowledge Base Error:",
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
   17. DATABASE TEST
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
