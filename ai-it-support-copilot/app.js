const SUPABASE_URL =
    "https://cpdakjvwsvtottatulwo.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_XM-TOIhVRRMqtPCQpIsX8A_XECc2BEv";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

function sleep(ms) {

    return new Promise(
        resolve => setTimeout(resolve, ms)
    );

}


function setProgress(percent) {

    document.getElementById(
        "progressBar"
    ).style.width = percent + "%";

}


function setStatus(text) {

    document.getElementById(
        "status"
    ).innerHTML = text;

}


async function analyzeTicket() {

    const user =
        document.getElementById(
            "userName"
        ).value;

    const system =
        document.getElementById(
            "systemType"
        ).value;

    const problem =
        document.getElementById(
            "problem"
        ).value;


    const result =
        document.getElementById(
            "result"
        );


    /* STEP 1 */

    setProgress(10);

    setStatus(
        "🧠 AI กำลังรับ Ticket..."
    );


    result.innerHTML = `
        <div class="ai-box">

            <h3>
                📥 Ticket Received
            </h3>

            <p>
                <b>ผู้แจ้ง:</b>
                ${user}
            </p>

            <p>
                <b>ระบบ:</b>
                ${system}
            </p>

            <p>
                <b>ปัญหา:</b>
                ${problem}
            </p>

        </div>
    `;


    await sleep(900);


    /* STEP 2 */

    setProgress(30);

    setStatus(
        "🔎 AI กำลังจำแนกปัญหา..."
    );


    result.innerHTML += `

        <div class="ai-box">

            <h3>
                🧠 AI Classification
            </h3>

            <p>
                Category:
                <b>Incident / Performance</b>
            </p>

            <p>
                AI กำลังสร้างสมมติฐาน
                Root Cause...
            </p>

        </div>

    `;


    await sleep(1000);


    /* STEP 3 */

    setProgress(55);

    setStatus(
        "🧪 AI กำลังสร้าง Troubleshooting Plan..."
    );


    result.innerHTML += `

        <div class="ai-box warning">

            <h3>
                🧪 Recommended Tests
            </h3>

            <ul>

                <li>
                    ตรวจ Network Latency
                </li>

                <li>
                    ตรวจ Packet Loss
                </li>

                <li>
                    ตรวจ Server CPU / RAM
                </li>

                <li>
                    ตรวจ Database Response Time
                </li>

                <li>
                    ตรวจ Application Log
                </li>

            </ul>

        </div>

    `;


    await sleep(1100);


    /* STEP 4 */

    setProgress(75);

    setStatus(
        "🎯 AI กำลังประเมิน Root Cause..."
    );


    result.innerHTML += `

        <div class="ai-box success">

            <h3>
                🎯 Root Cause Hypothesis
            </h3>

            <p>
                <b>
                Database / Application
                Performance Bottleneck
                </b>
            </p>

            <div class="metrics">

                <div class="metric">

                    <strong>
                        82%
                    </strong>

                    <small>
                        Confidence
                    </small>

                </div>


                <div class="metric">

                    <strong>
                        5
                    </strong>

                    <small>
                        Tests
                    </small>

                </div>


                <div class="metric">

                    <strong>
                        2
                    </strong>

                    <small>
                        Suspects
                    </small>

                </div>

            </div>

        </div>

    `;


    await sleep(1000);


    /* STEP 5 */

    setProgress(100);

    setStatus(
        "✅ AI Analysis เสร็จแล้ว"
    );


    result.innerHTML += `

        <div class="ai-box">

            <h3>
                📄 AI Recommendation
            </h3>

            <p>

                ตรวจสอบ Database Query
                และ Application Response Time
                ก่อนสรุป Root Cause

            </p>

            <p>

                <b>
                ⚠️ หมายเหตุ:
                </b>

                ผลนี้เป็น
                <b>Hypothesis</b>
                ต้องยืนยันด้วย Evidence จริง

            </p>

        </div>


        <div class="ai-box">

            <h3>
                🧠 Knowledge Base Candidate
            </h3>

            <p>

                AI สามารถนำ Case นี้ไปสร้าง
                Knowledge Base หลังจาก IT
                ยืนยันวิธีแก้ไขแล้ว

            </p>

        </div>

    `;

}

async function createTicket() {

    const user =
        document.getElementById("userName").value.trim();

    const system =
        document.getElementById("systemType").value;

    const problem =
        document.getElementById("problem").value.trim();

    const result =
        document.getElementById("result");

    const status =
        document.getElementById("status");


    // Validate
    if (!user || !problem) {

        status.innerHTML =
            "⚠️ กรุณากรอกผู้แจ้งและรายละเอียดปัญหา";

        return;
    }


    // Generate Ticket Number
    const ticketNo =
        "INC-" +
        Date.now().toString().slice(-8);


    status.innerHTML =
        "⏳ กำลังบันทึก Ticket ลง Supabase...";

    setProgress(30);


    try {

        const { data, error } =
            await supabaseClient
                .from("tickets")
                .insert([
                    {
                        ticket_no: ticketNo,

                        user_name: user,

                        system_type: system,

                        problem: problem,

                        status: "Open",

                        priority: "Medium"
                    }
                ])
                .select()
                .single();


        if (error) {

            console.error(error);

            throw error;
        }


        setProgress(100);

        status.innerHTML =
            "✅ Ticket ถูกบันทึกลง Database แล้ว";


        result.innerHTML = `

            <div class="ai-box success">

                <h3>
                    🎫 Ticket Created
                </h3>

                <p>
                    <b>Ticket No:</b>
                    ${data.ticket_no}
                </p>

                <p>
                    <b>ผู้แจ้ง:</b>
                    ${data.user_name}
                </p>

                <p>
                    <b>ระบบ:</b>
                    ${data.system_type}
                </p>

                <p>
                    <b>สถานะ:</b>
                    ${data.status}
                </p>

                <p>
                    <b>Priority:</b>
                    ${data.priority}
                </p>

            </div>

            <div class="ai-box">

                <h3>
                    🗄️ Database
                </h3>

                <p>
                    ข้อมูลถูกบันทึกลง
                    <b>Supabase → tickets</b>
                    เรียบร้อยแล้ว
                </p>

            </div>

            <div class="ai-box">

                <h3>
                    🤖 Next Step
                </h3>

                <p>
                    Phase 3 จะให้ AI อ่าน Ticket นี้
                    และค้น Knowledge Base
                    เพื่อสร้าง Troubleshooting Plan
                </p>

            </div>

        `;

    }
    catch (error) {

        console.error(
            "Create Ticket Error:",
            error
        );

        setProgress(0);

        status.innerHTML =
            "❌ ไม่สามารถบันทึก Ticket ได้";


        result.innerHTML = `

            <div class="ai-box warning">

                <h3>
                    ❌ Database Error
                </h3>

                <p>
                    ${escapeHtml(error.message)}
                </p>

                <p>
                    ตรวจสอบ:
                </p>

                <ul>

                    <li>
                        Supabase URL
                    </li>

                    <li>
                        Publishable Key
                    </li>

                    <li>
                        RLS Policy
                    </li>

                    <li>
                        Internet Connection
                    </li>

                </ul>

            </div>

        `;
    }
}


function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}
