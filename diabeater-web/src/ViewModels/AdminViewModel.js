// src/viewmodels/AdminViewModel.js
import { makeAutoObservable } from 'mobx';
import AdminRepository from '../Repositories/AdminRepository';

class AdminViewModel {
    currentView = 'dashboard';
    isAdmin = false;
    error = '';

    constructor() {
        makeAutoObservable(this);
    }

    setCurrentView(view) {
        this.currentView = view;
    }

    async verifyAdminAccess() {
        const result = await AdminRepository.isAdmin();
        console.log ('result:', result);
        if (result.success && result.isAdmin) {
            this.isAdmin = true;
        } else {
            this.error = result.error || "Access denied";
            this.isAdmin = false;
        }
    }
}

export default new AdminViewModel();
