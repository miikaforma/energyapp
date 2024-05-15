CREATE TABLE cbase_pv_forecast (
    time TIMESTAMPTZ NOT NULL,
    temp_avg FLOAT,
    wind_avg FLOAT,
    cl_tot FLOAT,
    cl_low FLOAT,
    cl_med FLOAT,
    cl_high FLOAT,
    prec_amt FLOAT,
    s_glob FLOAT,
    s_dif FLOAT,
    s_dir_hor FLOAT,
    s_dir FLOAT,
    s_sw_net FLOAT,
    solar_angle_vs_panel FLOAT,
    albedo FLOAT,
    s_glob_pv FLOAT,
    s_ground_dif_pv FLOAT,
    s_dir_pv FLOAT,
    s_dif_pv FLOAT,
    pv_po FLOAT,
    pv_t FLOAT,
    pv_eta FLOAT,
    UNIQUE (time)
);

SELECT CREATE_HYPERTABLE('cbase_pv_forecast', BY_RANGE('time'));
