 <?php
          if(isset($_GET['error']) && $_GET['error'] == 1) {
              echo "<p style='color:red;'>ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง!</p>";
              $way_flow = 1;
          }
          if(isset($_GET['success']) && $_GET['success'] == 2) {
              echo "<p style='color:green;'>เข้าสู่ระบบ สำเร็จ!</p>";
              $way_flow = 2; 
          }

          ?>