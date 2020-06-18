const ERR = require('async-stacktrace');
const _ = require('lodash');
const error = require('@prairielearn/prairielib/error');
const sqldb = require('@prairielearn/prairielib/sql-db');
const sqlLoader = require('@prairielearn/prairielib/sql-loader');
const sql = sqlLoader.loadSqlEquiv(__filename);

module.exports = function(req, res, next) {
    const params = {
        authn_user_id: res.locals.authn_user.user_id,
        course_id: req.params.course_id,
        is_administrator: res.locals.is_administrator,
        req_date: res.locals.req_date,
    };
    sqldb.queryOneRow(sql.select_authz_data, params, function(err, result) {
        if (ERR(err, next)) return;

        const permissions_course = result.rows[0].permissions_course;
        res.locals.course = result.rows[0].course;
        res.locals.courses = result.rows[0].courses;
        res.locals.course_instances = result.rows[0].course_instances;

        if (permissions_course.course_role == 'None') {
            return next(error.make(403, 'Access denied'));
        }

        res.locals.authz_data = {
            authn_user: _.cloneDeep(res.locals.authn_user),
            authn_course_role: permissions_course.course_role,
            authn_has_course_permission_preview: permissions_course.has_course_permission_preview,
            authn_has_course_permission_view: permissions_course.has_course_permission_view,
            authn_has_course_permission_edit: permissions_course.has_course_permission_edit,
            authn_has_course_permission_own: permissions_course.has_course_permission_own,
            user: _.cloneDeep(res.locals.authn_user),
            course_role: permissions_course.course_role,
            has_course_permission_preview: permissions_course.has_course_permission_preview,
            has_course_permission_view: permissions_course.has_course_permission_view,
            has_course_permission_edit: permissions_course.has_course_permission_edit,
            has_course_permission_own: permissions_course.has_course_permission_own,
        };
        res.locals.user = res.locals.authz_data.user;

        // FIXME: Implement effective users for course pages

        next();
    });
};