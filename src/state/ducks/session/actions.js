import * as types from './types';

export const initialize = (isAuthenticated) => ({
	type: types.INITIALIZE,
	payload: {isAuthenticated}
});

export const login = () => ({
	type: types.LOGIN
});

export const loginSuccess = (user) => ({
	type: types.LOGIN_SUCCESS,
	payload: {user}
});

export const loginError = (error) => ({
	type: types.LOGIN_ERROR,
	payload: {error},
	error: true
});

export const logout = () => ({
	type: types.LOGOUT
});

export const logoutSuccess = () => ({
	type: types.LOGOUT_SUCCESS
});

export const logoutError = (error) => ({
	type: types.LOGOUT_ERROR,
	payload: {error},
	error: true
});

export const register = () => ({
	type: types.REGISTER
});

export const registerError = (error) => ({
	type: types.REGISTER_ERROR,
	payload: {error},
	error: true
});

export const setArmed = () => ({
	type: types.SET_ARMED,
	payload: {mode: -1}
});

export const setArmedSuccess = (mode) => ({
	type: types.SET_ARMED_SUCCESS,
	payload: {mode},
	error: true
});

export const setArmedError = (mode, error) => ({
	type: types.SET_ARMED_ERROR,
	payload: {mode, error},
	error: true
});

export const changePassword = () => ({
	type: types.CHANGE_PASSWORD
});

export const changePasswordSuccess = () => ({
	type: types.CHANGE_PASSWORD_SUCCESS
});

export const changePasswordError = (error) => ({
	type: types.CHANGE_PASSWORD_ERROR,
	payload: {error},
	error: true
});

