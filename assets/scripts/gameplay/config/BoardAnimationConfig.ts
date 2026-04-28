export class BoardAnimationConfig {
    public static readonly DESTROY_DURATION = 0.14;
    public static readonly DESTROY_SCALE = 0.15;
    public static readonly DESTROY_EASING = "quadIn";

    public static readonly SPAWN_SCALE_FROM = 0;
    public static readonly SPAWN_SCALE_TO = 1.08;
    public static readonly SPAWN_DURATION_MAIN = 0.16;
    public static readonly SPAWN_DURATION_SETTLE = 0.06;
    public static readonly SPAWN_EASING = "backOut";

    public static readonly MOVE_DURATION = 0.22;
    public static readonly MOVE_EASING = "quadOut";

    public static readonly REFILL_SPAWN_OFFSET_Y = 2;

    public static readonly INVALID_SCALE_DOWN = 0.92;
    public static readonly INVALID_SCALE_UP = 1.04;
    public static readonly INVALID_DURATION_DOWN = 0.06;
    public static readonly INVALID_DURATION_UP = 0.08;
}