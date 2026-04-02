graph LR
    subgraph " "
    direction LR
    A[Client<br>ผู้ใช้งาน/เบราว์เซอร์] -- "1. Request (ร้องขอข้อมูล/บริการ)" --> B[Server<br>ผู้ให้บริการ/เครื่องแม่ข่าย]
    B -- "2. Response (ส่งข้อมูล/ผลลัพธ์กลับ)" --> A
    end

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#bbf,stroke:#333,stroke-width:2px
