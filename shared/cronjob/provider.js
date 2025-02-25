const q = require('q');
const cron = require('node-cron');
const { CronJobConst } = require('./const');
const { TaskService } = require("../../app/office/task/service");
const { TaskTemplateService } = require("../../app/office/task_template/service");
const { WorkflowPlayService } = require('../../app/office/workflow_play/service')
const { FileConst } = require('../file/file.const');
const { MultiTenant } = require('../multi_tenant/provider');
const { LogProvider } = require('../log_nohierarchy/log.provider');
const { TENANT_SOURCE_PATH } = process.env;
class CronJobProvider {
    constructor() { }

    initializeJobs() {
        if (TENANT_SOURCE_PATH) {
            LogProvider.info(`CronjobProvider.initializeJobs Local Path: ${TENANT_SOURCE_PATH}`);
            try {
                const tenantSource = require(TENANT_SOURCE_PATH);
                this.repeatCyclicalTaskJob(tenantSource.dbname_prefix, CronJobConst.CRON_EVERY_WORKING_DAY_AT_MIDNIGHT);
                this.notifyOverdueTasks(tenantSource.dbname_prefix, CronJobConst.CRON_EVERY_WORKING_DAY_AT_MIDNIGHT);
                this.notifyUpcomingDeadlineTasksDaily(tenantSource.dbname_prefix, CronJobConst.CRON_EVERY_DAY_AT_MIDNIGHT);
                this.notifyUpcomingDeadlineTasksWeekly(tenantSource.dbname_prefix, CronJobConst.CRON_EVERY_WEEK_AT_MIDNIGHT_ON_MONDAY);
                this.notifyUpcomingWorkflowPlayDaily(tenantSource.dbname_prefix, CronJobConst.CRON_EVERY_DAY_AT_MIDNIGHT);
            } catch (error) {
                console.log(err);
            }

        } else {
            LogProvider.info(`CronjobProvider.initializeJobs MultiTenant`);
            MultiTenant.getActiveTenants().then(tenants => {
                for (var i in tenants) {
                    this.repeatCyclicalTaskJob(tenants[i].dbname_prefix, CronJobConst.CRON_EVERY_WORKING_DAY_AT_MIDNIGHT);
                    this.notifyOverdueTasks(tenants[i].dbname_prefix, CronJobConst.CRON_EVERY_WORKING_DAY_AT_MIDNIGHT);
                    this.notifyUpcomingDeadlineTasksDaily(tenants[i].dbname_prefix, CronJobConst.CRON_EVERY_DAY_AT_MIDNIGHT);
                    this.notifyUpcomingDeadlineTasksWeekly(tenants[i].dbname_prefix, CronJobConst.CRON_EVERY_WEEK_AT_MIDNIGHT_ON_MONDAY);
                    this.notifyUpcomingWorkflowPlayDaily(tenants[i].dbname_prefix, CronJobConst.CRON_EVERY_DAY_AT_MIDNIGHT);
                }
            }).catch(err => {
                LogProvider.info(`CronjobProvider.initializeJobs Encounter Error: ${err.msg || err.message}`, err);
            });
        }
    }

    repeatCyclicalTaskJob(dbname_prefix, cronExpression) {
        LogProvider.info(`CronjobProvider.repeatCyclicalTaskJob register cronjob for dbname_prefix: ${dbname_prefix}, expression: ${cronExpression}`)
        cron.schedule(
            cronExpression,
            () => {
                LogProvider.info(`CronjobProvider.repeatCyclicalTaskJob START cronjob for ${dbname_prefix}`)
                TaskTemplateService.repeatTemplateTasks(dbname_prefix)
                    .then(({ total, success, failure }) => {
                        LogProvider.info(`CronjobProvider.repeatCyclicalTaskJob END cronjob for ${dbname_prefix} with total: ${total}, success: ${success}, failure: ${failure}`);
                    }).catch(err => {
                        LogProvider.info(`CronjobProvider.repeatCyclicalTaskJob END cronjob for ${dbname_prefix} with error: ${err.msg || err.message}`, err);
                    });
            },
            {
                scheduled: true,
                timezone: CronJobConst.TIME_ZONE,
            }
        );
    }

    notifyOverdueTasks(dbname_prefix, cronExpression) {
        LogProvider.info(`CronjobProvider.notifyOverdueTasks register cronjob for dbname_prefix: ${dbname_prefix}, expression: ${cronExpression}`)
        cron.schedule(
            cronExpression,
            () => {
                LogProvider.info(`CronjobProvider.notifyOverdueTasks START cronjob for ${dbname_prefix}`)
                TaskService.notifyOverdueTasks(dbname_prefix)
                    .then((total) => {
                        LogProvider.info(`CronjobProvider.notifyOverdueTasks END cronjob for ${dbname_prefix} with total overdue task notified: ${total}}`);
                    }).catch(err => {
                        LogProvider.info(`CronjobProvider.notifyOverdueTasks END cronjob for ${dbname_prefix} with error: ${err.msg || err.message}`, err);
                    });
            },
            {
                scheduled: true,
                timezone: CronJobConst.TIME_ZONE,
            }
        );
    }

    notifyUpcomingDeadlineTasksDaily(dbname_prefix, cronExpression) {
        LogProvider.info(`CronjobProvider.notifyUpcomingDeadlineTasksDaily register cronjob for dbname_prefix: ${dbname_prefix}, expression: ${cronExpression}`)
        cron.schedule(
            cronExpression,
            () => {
                LogProvider.info(`CronjobProvider.notifyUpcomingDeadlineTasksDaily START cronjob for ${dbname_prefix}`)
                TaskService.notifyUpcomingDeadlineTasksDaily(dbname_prefix)
                    .then((total) => {
                        LogProvider.info(`CronjobProvider.notifyUpcomingDeadlineTasksDaily END cronjob for ${dbname_prefix} with total tasks notified: ${total}}`);
                    }).catch(err => {
                        LogProvider.info(`CronjobProvider.notifyUpcomingDeadlineTasksDaily END cronjob for ${dbname_prefix} with error: ${err.msg || err.message}`, err);
                    });
            },
            {
                scheduled: true,
                timezone: CronJobConst.TIME_ZONE,
            }
        );
    }

    notifyUpcomingDeadlineTasksWeekly(dbname_prefix, cronExpression) {
        LogProvider.info(`CronjobProvider.notifyUpcomingDeadlineTasksWeekly register cronjob for dbname_prefix: ${dbname_prefix}, expression: ${cronExpression}`)
        cron.schedule(
            cronExpression,
            () => {
                LogProvider.info(`CronjobProvider.notifyUpcomingDeadlineTasksWeekly START cronjob for ${dbname_prefix}`)
                TaskService.notifyUpcomingDeadlineTasksWeekly(dbname_prefix)
                    .then((total) => {
                        LogProvider.info(`CronjobProvider.notifyUpcomingDeadlineTasksWeekly END cronjob for ${dbname_prefix} with total tasks notified: ${total}}`);
                    }).catch(err => {
                        LogProvider.info(`CronjobProvider.notifyUpcomingDeadlineTasksWeekly END cronjob for ${dbname_prefix} with error: ${err.msg || err.message}`, err);
                    });
            },
            {
                scheduled: true,
                timezone: CronJobConst.TIME_ZONE,
            }
        );
    }

    notifyUpcomingWorkflowPlayDaily(dbname_prefix, cronExpression) {
        LogProvider.info(`CronjobProvider.notifyUpcomingWorkflowPlayDaily register cronjob for dbname_prefix: ${dbname_prefix}, expression: ${cronExpression}`)
        cron.schedule(
            cronExpression,
            () => {
                WorkflowPlayService.notifyUpcomingWorkflowPlayDaily(dbname_prefix)
                    .then(() => {
                        LogProvider.info("Job run success");
                    })
                    .catch((error) => {
                        LogProvider.error("Job run error", error);
                    });
            },
            {
                scheduled: true,
                timezone: CronJobConst.TIME_ZONE,
            },
        );
    }

}

exports.cronJobProvider = new CronJobProvider();
