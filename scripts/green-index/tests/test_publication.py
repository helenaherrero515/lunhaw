from compute import still_agrees

ROW = {"tree_pct": 30.0, "other_veg_pct": 8.0, "water_pct": 2.0, "sealed_pct": 55.0}


def test_stays_published_when_within_tolerance_of_photo_check():
    summary = {"photo_pct": {"tree": 25.0, "other_veg": 6.0, "water": 0.0, "sealed": 62.0, "bare": 7.0}}
    assert still_agrees(ROW, summary)


def test_unpublished_when_any_component_drifts_beyond_tolerance():
    summary = {"photo_pct": {"tree": 18.0, "other_veg": 8.0, "water": 2.0, "sealed": 55.0, "bare": 17.0}}
    assert not still_agrees(ROW, summary)


def test_never_published_without_a_photo_check():
    assert not still_agrees(ROW, {})
