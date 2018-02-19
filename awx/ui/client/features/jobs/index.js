import atLibModels from '~models';
import atLibComponents from '~components';

import JobsStrings from '~features/jobs/jobs.strings';
import IndexController from '~features/jobs/index.controller';

const indexTemplate = require('~features/jobs/index.view.html');

const MODULE_NAME = 'at.features.jobs';

function resolveResource (Job, ProjectUpdate, AdHocCommand, SystemJob, WorkflowJob, $stateParams) {
    const { id } = $stateParams;
    const { type } = $stateParams;

    let Resource;
    let related = 'events';

    switch (type) {
        case 'project':
            Resource = ProjectUpdate;
            break;
        case 'playbook':
            Resource = Job;
            related = 'job_events';
            break;
        case 'command':
            Resource = AdHocCommand;
            break;
        case 'system':
            Resource = SystemJob;
            break;
        case 'workflow':
            Resource = WorkflowJob;
            break;
        default:
            // Redirect
            return null;
    }

    return new Resource('get', id)
        .then(resource => resource.extend(related, {
            pageCache: true,
            pageLimit: 3,
            params: {
                page_size: 100,
                order_by: 'start_line'
            }
        }));
}

function resolveWebSocket (SocketService, $stateParams) {
    const { type, id } = $stateParams;
    const prefix = 'ws';

    let name;
    let events;

    switch (type) {
        case 'system':
            name = 'system_jobs';
            events = 'system_job_events';
            break;
        case 'project':
            name = 'project_updates';
            events = 'project_update_events';
            break;
        case 'command':
            name = 'ad_hoc_commands';
            events = 'ad_hoc_command_events';
            break;
        case 'inventory':
            name = 'inventory_updates';
            events = 'inventory_update_events';
            break;
        case 'playbook':
            name = 'jobs';
            events = 'job_events';
            break;
    }

    const state = {
        data: {
            socket: {
                groups: {
                    [name]: ['status_changed', 'summary'],
                    [events]: []
                }
            }
        }
    };

    SocketService.addStateResolve(state, id);

    return `${prefix}-${events}-${id}`;
}

function resolveBreadcrumb (strings) {
    return {
        label: strings.get('state.TITLE')
    };
}

function JobsRun ($stateRegistry) {
    const state = {
        name: 'jobz',
        url: '/jobz/:type/:id',
        route: '/jobz/:type/:id',
        data: {
            activityStream: true,
            activityStreamTarget: 'jobs'
        },
        views: {
            '@': {
                templateUrl: indexTemplate,
                controller: IndexController,
                controllerAs: 'vm'
            }
        },
        resolve: {
            resource: [
                'JobModel',
                'ProjectUpdateModel',
                'AdHocCommandModel',
                'SystemJobModel',
                'WorkflowJobModel',
                '$stateParams',
                resolveResource
            ],
            ncyBreadcrumb: [
                'JobsStrings',
                resolveBreadcrumb
            ],
            webSocketNamespace: [
                'SocketService',
                '$stateParams',
                resolveWebSocket
            ]
        },
    };

    $stateRegistry.register(state);
}

JobsRun.$inject = ['$stateRegistry'];

angular
    .module(MODULE_NAME, [
        atLibModels,
        atLibComponents
    ])
    .controller('indexController', IndexController)
    .service('JobsStrings', JobsStrings)
    .run(JobsRun);

export default MODULE_NAME;
