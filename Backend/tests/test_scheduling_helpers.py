"""Tests unitarios para helpers internos del solver y construcción de patrones."""

from app.scheduling_demo import _pattern_convenience_penalty, _slot_start_minutes
from app.scheduling_demo_data import _build_patterns_by_blocks, _split_slots_by_day


def test_slot_start_minutes_converts_time_to_minutes():
    assert _slot_start_minutes("Lun 07:00-08:30") == 420
    assert _slot_start_minutes("Mar 12:00-13:30") == 720


def test_pattern_convenience_penalty_prefers_compact_patterns():
    compact_pattern = ("Lun 07:00-08:30", "Lun 08:40-10:10")
    dispersed_pattern = ("Lun 07:00-08:30", "Mie 19:00-20:30")

    assert _pattern_convenience_penalty(compact_pattern) < _pattern_convenience_penalty(
        dispersed_pattern
    )


def test_split_slots_by_day_groups_slots_correctly():
    slots = (
        "Lun 07:00-08:30",
        "Lun 08:40-10:10",
        "Mar 07:00-08:30",
    )

    grouped = _split_slots_by_day(slots)

    assert set(grouped.keys()) == {"Lun", "Mar"}
    assert grouped["Lun"] == ["Lun 07:00-08:30", "Lun 08:40-10:10"]
    assert grouped["Mar"] == ["Mar 07:00-08:30"]


def test_build_patterns_by_blocks_returns_patterns_for_1_2_and_3_blocks():
    slots = (
        "Lun 07:00-08:30",
        "Lun 08:40-10:10",
        "Lun 10:20-11:50",
        "Mar 07:00-08:30",
        "Mar 08:40-10:10",
        "Mar 10:20-11:50",
        "Mie 07:00-08:30",
        "Mie 08:40-10:10",
        "Mie 10:20-11:50",
    )

    patterns = _build_patterns_by_blocks(slots)

    assert set(patterns.keys()) == {1, 2, 3}
    assert all(len(pattern) == 1 for pattern in patterns[1])
    assert all(len(pattern) == 2 for pattern in patterns[2])
    assert all(len(pattern) == 3 for pattern in patterns[3])
    assert ("Lun 07:00-08:30", "Lun 08:40-10:10") in patterns[2]
    assert ("Lun 07:00-08:30", "Mar 07:00-08:30") in patterns[2]
    assert ("Lun 07:00-08:30", "Mar 07:00-08:30", "Mie 07:00-08:30") in patterns[3]
