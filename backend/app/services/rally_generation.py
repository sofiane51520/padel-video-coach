from app.models.analysis import RallySuggestion, VideoProbe


class RallyGenerationService:
    def generate(self, video_probe: VideoProbe) -> list[RallySuggestion]:
        duration_seconds = max(1, round(video_probe.duration_seconds))
        rally_count = self._rally_count(duration_seconds)
        slot_seconds = duration_seconds / rally_count
        rallies: list[RallySuggestion] = []

        for index in range(rally_count):
            start_seconds = round(index * slot_seconds + min(4, slot_seconds * 0.18))
            end_seconds = round(
                min(
                    duration_seconds,
                    start_seconds + max(2, slot_seconds * 0.68),
                )
            )

            if end_seconds <= start_seconds:
                end_seconds = min(duration_seconds, start_seconds + 1)

            rallies.append(
                RallySuggestion(
                    id=f"r{index + 1}",
                    index=index + 1,
                    start_time=self._format_clock(start_seconds),
                    end_time=self._format_clock(end_seconds),
                )
            )

        return rallies

    def _rally_count(self, duration_seconds: int) -> int:
        if duration_seconds < 45:
            return max(1, round(duration_seconds / 20))

        return min(18, max(4, round(duration_seconds / 45)))

    def _format_clock(self, total_seconds: int) -> str:
        minutes = total_seconds // 60
        seconds = total_seconds % 60

        return f"{minutes:02d}:{seconds:02d}"


rally_generation_service = RallyGenerationService()
