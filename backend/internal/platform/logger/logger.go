package logger

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"strconv"
	"strings"
	"sync"
	"time"
)

const (
	colorReset  = "\033[0m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorRed    = "\033[31m"
)

func New(env string, out io.Writer) *slog.Logger {
	if env == "local" || env == "dev" || env == "development" {
		return slog.New(newColorTextHandler(out))
	}
	return slog.New(slog.NewTextHandler(out, nil))
}

type colorTextHandler struct {
	out    io.Writer
	mu     *sync.Mutex
	attrs  []slog.Attr
	groups []string
}

func newColorTextHandler(out io.Writer) *colorTextHandler {
	return &colorTextHandler{
		out: out,
		mu:  &sync.Mutex{},
	}
}

func (h *colorTextHandler) Enabled(context.Context, slog.Level) bool {
	return true
}

func (h *colorTextHandler) Handle(_ context.Context, record slog.Record) error {
	var builder strings.Builder
	builder.WriteString("time=")
	builder.WriteString(record.Time.Format(time.RFC3339Nano))
	builder.WriteString(" level=")
	builder.WriteString(colorLevel(record.Level))
	builder.WriteString(" msg=")
	builder.WriteString(strconv.Quote(record.Message))

	for _, attr := range h.attrs {
		writeAttr(&builder, h.groups, attr)
	}
	record.Attrs(func(attr slog.Attr) bool {
		writeAttr(&builder, h.groups, attr)
		return true
	})
	builder.WriteByte('\n')

	h.mu.Lock()
	defer h.mu.Unlock()
	_, err := io.WriteString(h.out, builder.String())
	return err
}

func (h *colorTextHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	next := *h
	next.attrs = append(append([]slog.Attr{}, h.attrs...), attrs...)
	return &next
}

func (h *colorTextHandler) WithGroup(name string) slog.Handler {
	if name == "" {
		return h
	}
	next := *h
	next.groups = append(append([]string{}, h.groups...), name)
	return &next
}

func colorLevel(level slog.Level) string {
	switch {
	case level >= slog.LevelError:
		return colorRed + level.String() + colorReset
	case level >= slog.LevelWarn:
		return colorYellow + level.String() + colorReset
	default:
		return colorGreen + level.String() + colorReset
	}
}

func writeAttr(builder *strings.Builder, groups []string, attr slog.Attr) {
	attr.Value = attr.Value.Resolve()
	if attr.Equal(slog.Attr{}) {
		return
	}

	builder.WriteByte(' ')
	if len(groups) > 0 {
		builder.WriteString(strings.Join(groups, "."))
		builder.WriteByte('.')
	}
	builder.WriteString(attr.Key)
	builder.WriteByte('=')
	builder.WriteString(formatValue(attr.Value))
}

func formatValue(value slog.Value) string {
	switch value.Kind() {
	case slog.KindString:
		return strconv.Quote(value.String())
	case slog.KindTime:
		return value.Time().Format(time.RFC3339Nano)
	case slog.KindDuration:
		return value.Duration().String()
	case slog.KindBool:
		return strconv.FormatBool(value.Bool())
	case slog.KindInt64:
		return strconv.FormatInt(value.Int64(), 10)
	case slog.KindUint64:
		return strconv.FormatUint(value.Uint64(), 10)
	case slog.KindFloat64:
		return strconv.FormatFloat(value.Float64(), 'f', -1, 64)
	default:
		return strconv.Quote(fmt.Sprint(value.Any()))
	}
}
