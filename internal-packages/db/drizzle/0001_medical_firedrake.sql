-- Custom SQL migration file, put you code below! --
SELECT create_hypertable('logs', by_range('timestamp'));
CREATE INDEX ix_project_id_timestamp ON logs (project_id, timestamp DESC);
CREATE INDEX ix_project_id_timestamp_action ON logs (project_id, timestamp DESC, action);

