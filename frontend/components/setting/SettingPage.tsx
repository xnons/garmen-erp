"use client";

import React from 'react';
import SettingModule from './SettingModule';

interface SettingPageProps {
    activeUser: any;
    onLogout?: () => void;
    onNavigateMenu?: (menuId: string) => void;
}

export const SettingPage: React.FC<SettingPageProps> = ({ activeUser, onLogout = () => {}, onNavigateMenu }) => {
    return <SettingModule activeUser={activeUser} onLogout={onLogout} onNavigateMenu={onNavigateMenu} />;
};

export default SettingPage;