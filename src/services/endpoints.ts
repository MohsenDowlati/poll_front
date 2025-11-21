const endpoints = {
    auth: {
        login: '/login',
        signup: '/signup',
        refresh: '/refresh',
        logout: '/logout',
    },
    notification: {
        notification: '/poll/notifications',
        approve: (id: string | number) => '/poll/notifications/' + id + '/approve',
        reject: (id: string | number) => '/poll/notifications/' + id + '/reject',
    },
    admin: {
        users: '/admin/users',
        updateStatus: '/admin/users/status',
        deleteUser: (id: string | number) => `/admin/users/${encodeURIComponent(String(id))}`,
    },
    sheet: {
        fetch: '/sheet/fetch',
        create: '/sheet/create',
        delete: '/sheet/delete',
        finish: '/sheet/finish',
        exportSheet: (id: string | number) => `/sheet/export/${encodeURIComponent(String(id))}`,
    },
    poll: {
        fetch: '/client/fetch',
        adminFetch: '/admin/fetch',
        submit: '/submit',
        create: '/create',
        delete: '/delete',
    },
};

export default endpoints;
