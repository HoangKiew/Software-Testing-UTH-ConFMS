import { Outlet, useLocation } from 'react-router-dom';
import FeatureStudent from "../components/FeatureStudent";
import Footer from "../components/Footer";
import HeaderStudent from "../components/HeaderStudent";
import HeroStudent from "../components/HeroStudent";

const LayoutAppStudent = () => {
    const location = useLocation();
    const hideHeroFeature = location.pathname.startsWith('/student') || location.pathname.startsWith('/reviewer');

    return (
        <>
            <HeaderStudent/>
            {!hideHeroFeature && <HeroStudent/>}
            {!hideHeroFeature && <FeatureStudent/>}
            <Outlet />
            <Footer/>
        </>
    );
}

export default LayoutAppStudent;
