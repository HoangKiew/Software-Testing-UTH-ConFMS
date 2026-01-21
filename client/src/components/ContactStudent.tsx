import imageUth from '../assets/image-uth.jpg';

const ContactStudent = () => {

  return (
    <div id="contact" className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
      <div className="max-w-7xl mx-auto" id='contact'>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center ">
          <div className="order-2 lg:order-1">
            <img
              src={imageUth}
              alt="Đại Học Giao Thông Vận Tải Thành Phố Hồ Chí Minh"
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>

          <div className=" w-[500px] text-xl order-1 lg:order-2 space-y-6 ml-0 lg:ml-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              UTH-ConfMS
            </h2>
            <p className="text-md max-w-[380px] md:max-w-full md:text-lg text-gray-600 leading-relaxed">
              Hệ thống UTH-ConfMS cung cấp một quy trình khép kín cho một hội nghị khoa học: từ lúc Nộp bài,Phản biện, Chỉnh sửa đến khi Công bố kết quả, giúp thay thế hoàn toàn việc quản lý thủ công bằng file Excel hay Email rời rạc.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactStudent;










