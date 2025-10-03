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
    },
    sheet: {
        fetch: '/sheet/fetch',
        create: '/sheet/create',
        delete: '/sheet/delete',
    },
    poll: {
        fetch: '/client/fetch',
        adminFetch: '/admin/fetch',
        submit: '/submit',
        create: '/create',
    },
};

export default endpoints;
