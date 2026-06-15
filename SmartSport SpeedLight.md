
B1: Khách hàng || CSKH tạo pickup -> Sẽ thông báo trên app

`	`**Lưu ý:** Khi KH tạo pickup thì sẽ cho lựa chọn loại: 

`		`+ Hàng Hoá 

`			`+ Giá trị cao (Giá >= 3 triệu)

`			`+ Chung (chất lỏng bao gồm pin)

`		`+ Bưu phẩm bưu kiện (thư) thảo luận hiện tại 

`	`**=> CTY sẽ gửi bảng giá mỗi khách hàng có mỗi bảng giá cước 			riêng**	

`	`- Thêm vào danh sách khách hàng hiện có hiển thị cho nhân viên 			điều phối lựa chọn 



`		`- Danh sách khách hàng điều phối là danh sách khách hàng 				với những 	yêu cầu pickup

`	`Lưu ý: Gom các bìa thư vào một nơi của mã khách hàng tạo 				pickup ấy không cho các pickup rời rạc và sẽ bung xuống hiển thị 			khi bấm vào mã khách hàng nếu khách hàng tạo hoặc NVĐP tạo 			các pickup cho mã khách hàng

B2: Mặc đinh CSKH điều phối quản lý bưu tá  gán với khách đến lấy hàng || Qua Trưởng phòng giao nhận điều phối bưu tá và xe 

`	`Nếu khách thân thiết -> CHỉ đến lấy hàng (khách tạo mã bill, và 			nhập thông tin lên app -> có thể thiếu các trường trọng lượng, 			kích thước) 

`		`- DS khách thân thiết sẽ được import vào hệ thống để quản lí  		(bao gồm mã bưu tá chính và 1 mã cộng tác viên chung nếu 				bưu tá chính không đi giao nhận được, giá cước, mã NVĐP 				quản lý của khách hàng đó luôn)

`			`- 1 mã cộng tác viên sẽ gán cho tất cả khách thân thiết 

`		`- Khi khách thân thiết (Mã khách hàng gán với Mã bưu tá) 				tạo yêu cầu thì sẽ có BT được gán cho khách hàng ấy đến 				nhận hàng lấy hàng luôn



`		`**Lưu ý: Chưa nắm được các trường thông tin khách sẽ nhập 				để tạo bill / pickup CTY chưa gử**i 



`	`Khách gọi CSKH -> Bưu tá đến lấy và xác nhận số lượng đúng, đủ

`	`-> BT sử dụng app bật gps để NVĐP biết được đang ở đâu 				hiện tại vì BT ấy thuộc sự quản lý NVĐP ấy

`	`-> NVĐP sẽ chọn xe tải hoặc xe máy (Không bắt buộc)

`	`-> Màn hình app của bưu tá sẽ có danh sách các yêu cầu đi lấy 			hàng 	từ NVĐP 

`		`- Note thêm số lượng thư khách hàng để bưu tá biết nhận 				đủ số lượng thư yêu cầu và phát sinh thêm ( Không bắt buộc 				phải nhập )

`     `-> Bưu tá đến lấy hàng 

`	`- Trường hợp ít hơn 10 bìa thư:

`		`Có thể hoặc không OCR bìa thư ấy tại nơi nhận của khách 

`	`- Trường hợp nhiều bìa thư (chứa nhiều thư trên 10 thư):

`		`Hệ thống tạo mã túi thư khi khách hàng tạo một loạt và gom 				số lượng thư ấy vào mã túi thư (Bước pickup khi tạo lên hệ 				thống) 

`			`-> Bưu tá sẽ quét mã túi thư hiển thị số lượng thư

- Bưu tá điền -> Nhập vào ô số lương thực nhân tại điểm đó để xác nhận 20 (xác nhận)

`		`- Note lại: Cho BT nhập ghi chú là phát sinh thêm bao 					nhiêu

`		`- Hệ thống so sánh số lượng trong túi thư khi tạo pickup với 				số lượng xác nhận thư của BT khi nhận với khách hàng. Hệ 				thống thông báo số lượng chênh lệch đang thiếu thông tin 				chưa nhập trong túi thư cho NVĐP

- Bưu tá xác nhận thành công thì đơn hàng sẽ không nằm trong danh sách điều phối pickup và cũng xác nhận checkpoint xong cho khách hàng đó và tới địa điểm của khách tiếp theo

Ngoại lệ: Khi NVĐP điều BT đi bằng phương tiện xe máy đến nếu số lượng hàng hoá quá lớn thì BT sẽ gửi yêu cầu hỗ trợ đến TPGN

- Trước khi về văn phòng. Hoàn tất nhận hàng của khách cuối cùng 

`		`- Bưu tá chốt ca sum(số thư đã nhận)



`		`- Thông báo đổ số lượng từng khách với các pickup (thuộc 				mã kh tạo pickup) chốt ca trong ngày đi lấy thư được bao 				nhiêu về cho NVĐP quản lý 	của bưu tá ấy nắm được và kiểm 				tra		

(Mỗi bưu tá có một NVĐP riêng và điều phối bưu tá. Quản lý khách hàng của tuyến đó luôn)

- Sau khi lấy về văn phòng thì Bưu tá với NVĐP



`	`-> NVĐP xác nhận thì thư sẽ nhập vào kho

B3: CSKH scan OCR lên hệ thống hoàn thành các thông tin trọng lượng, kích thước thì submit lên hệ thống



`	`Lưu ý: Đối với số lượng bìa thư chưa được xác nhận trong túi thư 			lúc KH tạo pickup thì sẽ xuất hiện một form thông tin của mã túi 			thư ấy để NVĐP nhập bổ sung vào mã túi thư đó 	



- 1 luồng hiển thông tin trọng lượng, kích thước,…( Trọng lượng, Kích thước bổ sung) cho khách tra cứu. (chỉnh sửa từ trọng lượng thật của luồng 2 để ra giá cước read only)
- 2 luồng xử lý nội bộ (là thông tin thật)

`		`-> Xuất file để cập nhật lại những thông tin còn thiếu cho bổ 				sung để tính toán cước


B4: Nhân viên khai thác điều phối mới xuất nội bộ qua các kho khác (Xuất kho nội bộ) – Thêm kho bưu cục

- Xuất kho cho bưu tá đi giao -> Bưu tá tự scan và đi giao -> Sau khi scan xong sẽ tạo bảng kê chuyển cho NVĐP quản lý BT ấy theo dõi.
- Khi bắt đầu đi giao BT phải thống kê đi giao cho bao nhiêu khách ( mỗi khách chứa bao nhiêu mặt hàng ) 

- Khi bưu tá đến địa điểm giao -> chụp hình báo phát nhảy lên hệ thống và chuyển trạng thái giao thành công -> Bưu tá điền tên người nhận, ngày , kèm giờ (tự động lưu ngay thời điểm đó) CSKH có thể chỉnh sửa ngày giờ giao phát



`		`-> Giao thành công cho khách chuyển trạng thái 

`		`thì sẽ cập nhật lại số lượng tồn của các khách trong giỏ hàng 				hiện tại BT đang giao (với mặt hàng của khách) tới NVĐP để 				nắm được quá trình ngày hôm ấy BT giao hàng như thế nào 				giao được bao nhiêu còn lại bao nhiêu chưa giao hết trong 				ngày để ngày hôm sau đi giao tiếp tục




HCM -> Bưu cục đắklak

1 Bưu cục sẽ có danh sách mã tỉnh được nhận 

- Ví dụ khi scan 5 thư đi daklak có 1 thư không phải daklak thì thông báo HN (QN, QB, HL) – Bảng kê hoặc kiện (từng thư)
- Quản lý kho xác nhận hàng đến 





Các vai trò: Admin, Nhân viên điều phối (CSKH), Khách hàng, Bưu tá

Trưởng phòng giao nhận: quản lí 3 đầu thông tin xe máy, tải, thứ 3  (Thêm, Sửa) và điều phối xe, điều phối bưu tá

`	`Ngoại lệ: Trong quản lí xe sẽ có trường hợp đặt xe tải bên thứ 3

`		`Ví dụ: ahamo


**Mục chưa nắm rõ:**

`	`+ Trang thông tin thành viên 

`	`+ Thiếu công thức khi nhập luồng 2 trọng lượng kích thước thật 			thì sẽ dùng kích thước đó cập nhật lại thông tin cước phí read only 	cho luồng 1 khi khách hàng tra cứu (Bước 3) -> CTY đang suy nghĩ

`	`+ Xuất kho cho bưu tá đi giao -> Bưu tá tự scan và đi giao ( **Chưa 			nắm được nếu sai tuyến thư thì cảnh báo ở bước này rút thư ra 			trả lại** ) -> Sau khi scan xong sẽ tạo bảng kê chuyển cho NVĐP 			quản lý BT ấy theo dõi.

`	`+ Bưu tá chụp ảnh chuyển phát gửi và chuyển trạng thái giao 			thành công NVĐP của BT ấy tự vào xem hay là chuyển phát gửi 			ảnh và chuyển trạng thái thành công cho trực tiếp NVĐP quản lý 			BT ấy (Bước 4)

`	`+ Nhân viên điều phối (CSKH) có thể chỉnh sửa ngày giờ giao phát 			hàng CTY chưa chốt được điều chỉnh như thế nào đang hẹn lại đợi 	cập nhật

`	`+ Bưu tá warehouse nội bộ vs Bưu tá quản lý bởi NVĐP?





- Bảng kê kế toán:
  - Giống ITVINA ( mục Bảng kê ) note xoá cột nào hoặc không cần nào
- Tính toán chi phí:


