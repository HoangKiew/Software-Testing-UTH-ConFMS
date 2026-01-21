import HeorUth from '../assets/image-hero.jpg';
const HeroStudent = () => {

  return (
    <div className="bg-white max-w-custom w-[1360px] ml-auto mr-auto py-16">
      <div className="max-w-7xl mx-auto">
        <div className="flex-row gap-5 justify-between items-center md:flex">
          <div className="space-y-8 w-[660px]">
            <div className="space-y-4">
              <h1 className="text-3xl max-w-[380px] md:max-w-full md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                UTH Scientific Conference Paper Management System
              </h1>
              <p className="text-lg max-w-[380px] md:max-w-full md:text-xl text-gray-600 leading-relaxed">
                Hệ thống quản lý giấy tờ Hội nghị Nghiên cứu khoa học dành cho
                Trường Đại Học UTH
              </p>
              <button className='px-5 py-5 min-w-[180px] border-3 border-solid border-primary text-primary rounded-2xl text-lg transition duration-200 hover:bg-primary hover:text-white hover:font-semibold cursor-pointer'>
                Tìm hiểu thêm
              </button>
            </div>
          </div>
          <figure>
            <img src={HeorUth} alt="Hero" className="rounded-lg shadow-lg mt-10 md:mt-0" />
          </figure>
        </div>

        <div className="flex justify-center space-x-2 mt-20">
          <div className="w-3 h-3 bg-teal-600 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
          <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default HeroStudent;










