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
