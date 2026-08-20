/* =====================================================
   AI IT SUPPORT COPILOT
   PHASE 2.2

   GitHub Pages
        ↓
   Supabase JS
        ↓
   Supabase Data API
        ↓
   PostgreSQL
        ↓
   tickets
===================================================== */



/* =====================================================
   1. SUPABASE CONFIGURATION
===================================================== */


/*
    Project URL ของคุณ

    ใช้ .supabase.co
*/

const SUPABASE_URL =
    "https://cpdakjvwsvtotatulwo.supabase.co";



/*
    ใส่ Publishable Key ของคุณตรงนี้

    ต้องขึ้นต้นด้วย:

    sb_publishable_

    ห้ามใช้:

    sb_secret_
*/

const SUPABASE_PUBLISHABLE_KEY =
    "วาง_sb_publishable_key_ของคุณตรงนี้";



/* =====================================================
   2. CREATE SUPABASE CLIENT
===================================================== */


/*
    ตรวจสอบว่า Supabase Library โหลดสำเร็จหรือไม่
*/

if (!window.supabase) {

    console.error(
        "Supabase JavaScript library was not loaded."
    );

}



/*
    สร้าง Supabase Client
*/

const supabaseClient =
    window.supabase.createClient(

        SUPABASE_URL,

        SUPABASE_PUBLISHABLE_KEY

    );



/* =====================================================
   3. HELPER FUNCTIONS
===================================================== */


/*
    เปลี่ยน Progress Bar
*/

function setProgress(percent) {

    const progressBar =
        document.getElementById(
            "progressBar"
        );


    if (!progressBar) {
        return;
    }


    progressBar.style.width =
        percent + "%";

}



/*
    เปลี่ยนข้อความ Status
*/

function setStatus(message) {

    const status =
        document.getElementById(
            "status"
        );


    if (!status) {
        return;
    }


    status.innerHTML =
        message;

}



/*
    Escape HTML

    ป้องกันข้อมูล User ถูกนำไปแสดงเป็น HTML
*/

function escapeHtml(value) {

    if (value === null || value === undefined) {

        return "";

    }


    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}



/*
    สร้าง Ticket Number

    ตัวอย่าง:

    INC-12345678
*/

function generateTicketNumber() {

    const timestamp =
        Date.now()
            .toString()
            .slice(-8);


    return "INC-" + timestamp;

}



/* =====================================================
   4. CREATE TICKET
===================================================== */


async function createTicket() {


    /* -----------------------------------------------
       Get Form Elements
    ------------------------------------------------ */

    const userInput =
        document.getElementById(
            "userName"
        );


    const systemInput =
        document.getElementById(
            "systemType"
        );


    const problemInput =
        document.getElementById(
            "problem"
        );


    const priorityInput =
        document.getElementById(
            "priority"
        );


    const button =
        document.getElementById(
            "createTicketButton"
        );


    const result =
        document.getElementById(
            "result"
        );



    /* -----------------------------------------------
       Get Values
    ------------------------------------------------ */

    const userName =
        userInput.value.trim();


    const systemType =
        systemInput.value;


    const problem =
        problemInput.value.trim();


    const priority =
        priorityInput.value;



    /* -----------------------------------------------
       Validate
    ------------------------------------------------ */

    if (!userName) {

        setStatus(
            "⚠️ กรุณากรอกชื่อผู้แจ้ง"
        );

        userInput.focus();

        return;

    }



    if (!problem) {

        setStatus(
            "⚠️ กรุณากรอกรายละเอียดปัญหา"
        );

        problemInput.focus();

        return;

    }



    /* -----------------------------------------------
       Disable Button
    ------------------------------------------------ */

    button.disabled = true;

    button.innerHTML =
        "⏳ กำลังบันทึก...";



    setProgress(20);


    setStatus(
        "🔄 กำลังเชื่อมต่อ Supabase..."
    );



    /* -----------------------------------------------
       Generate Ticket Number
    ------------------------------------------------ */

    const ticketNo =
        generateTicketNumber();



    try {


        /* =============================================
           INSERT INTO tickets
        ============================================== */


        setProgress(40);


        setStatus(
            "🗄️ กำลังบันทึก Ticket ลง Database..."
        );



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



        /* -------------------------------------------
           Check Error
        -------------------------------------------- */


        if (error) {

            console.error(
                "Supabase Insert Error:",
                error
            );

            throw error;

        }



        /* =============================================
           SUCCESS
        ============================================== */


        setProgress(100);


        setStatus(
            "✅ Ticket บันทึกสำเร็จ"
        );



        result.innerHTML = `

            <div class="ai-box success">

                <h3>
                    🎉 Ticket Created Successfully
                </h3>


                <p>

                    <b>
                        Ticket No:
                    </b>

                    ${escapeHtml(
                        data.ticket_no
                    )}

                </p>


                <p>

                    <b>
                        ผู้แจ้ง:
                    </b>

                    ${escapeHtml(
                        data.user_name
                    )}

                </p>


                <p>

                    <b>
                        ระบบ:
                    </b>

                    ${escapeHtml(
                        data.system_type
                    )}

                </p>


                <p>

                    <b>
                        Priority:
                    </b>

                    ${escapeHtml(
                        data.priority
                    )}

                </p>


                <p>

                    <b>
                        Status:
                    </b>

                    ${escapeHtml(
                        data.status
                    )}

                </p>


            </div>



            <div class="ai-box">

                <h3>
                    🗄️ Database
                </h3>


                <p>

                    ข้อมูลถูกบันทึกลง

                    <b>
                        Supabase
                    </b>

                    →

                    <b>
                        tickets
                    </b>

                    เรียบร้อยแล้ว

                </p>


            </div>



            <div class="ai-box">

                <h3>
                    🔗 Ticket ID
                </h3>


                <p>

                    Database ID:

                    <b>
                        ${escapeHtml(
                            data.id
                        )}
                    </b>

                </p>


                <p>

                    Created:

                    ${escapeHtml(
                        data.created_at
                    )}

                </p>


            </div>



            <div class="ai-box">

                <h3>
                    🚀 Next Phase
                </h3>


                <p>

                    Phase 2.3:

                    <b>
                        Ticket List
                    </b>

                    และ

                    <b>
                        Ticket Detail
                    </b>

                </p>


                <p>

                    Phase 3:

                    AI จะนำ Ticket
                    ไปค้น Knowledge Base

                </p>


            </div>

        `;



    }

    catch (error) {


        /* =============================================
           ERROR
        ============================================== */


        console.error(
            "Create Ticket Error:",
            error
        );


        setProgress(0);


        setStatus(
            "❌ ไม่สามารถบันทึก Ticket ได้"
        );



        let errorMessage =
            "Unknown error";



        if (error) {

            errorMessage =
                error.message ||
                error.details ||
                error.hint ||
                "Unknown error";

        }



        result.innerHTML = `

            <div class="ai-box warning">

                <h3>
                    ❌ Database Error
                </h3>


                <p>

                    <b>
                        Error:
                    </b>

                    ${escapeHtml(
                        errorMessage
                    )}

                </p>


                <hr>


                <h3>
                    🔍 ตรวจสอบ
                </h3>


                <ul>

                    <li>
                        Supabase Project URL
                    </li>


                    <li>
                        Publishable Key
                    </li>


                    <li>
                        Data API
                    </li>


                    <li>
                        RLS Policy
                    </li>


                    <li>
                        tickets table
                    </li>


                    <li>
                        Internet Connection
                    </li>

                </ul>


            </div>

        `;

    }



    finally {


        /* -------------------------------------------
           Enable Button
        -------------------------------------------- */


        button.disabled =
            false;


        button.innerHTML =
            "🎫 Create Ticket";

    }

}



/* =====================================================
   5. TEST DATABASE CONNECTION
===================================================== */


/*
    ฟังก์ชันนี้เอาไว้ Debug

    ยังไม่ต้องเรียกใช้จากหน้าเว็บก็ได้

    เปิด Browser Console แล้วพิมพ์:

    testDatabase()

    เพื่อทดสอบ Supabase
*/

async function testDatabase() {


    console.log(
        "Testing Supabase connection..."
    );


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
