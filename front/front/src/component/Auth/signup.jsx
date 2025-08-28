import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import axios from "axios";
import "../../styles/Auth/signupform.css";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  const validators = {
    name: (v) => (!v ? "이름을 입력해주세요." : ""),
    email: (v) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? "" : "올바른 이메일 형식이 아닙니다.",
    password: (v) => (v.length >= 4 ? "" : "비밀번호는 최소 4자 이상이어야 합니다."),
    confirm: (v, all) => (v === all.password ? "" : "비밀번호가 일치하지 않습니다."),
  };
  const validateField = (name, value, all = form) => (validators[name] ? validators[name](value, all) : "");
  const validateAll = (next = form) => ({
    name: validateField("name", next.name, next),
    email: validateField("email", next.email, next),
    password: validateField("password", next.password, next),
    confirm: validateField("confirm", next.confirm, next),
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    const nextErr = { ...errors, [name]: validateField(name, value, next) };
    if (name === "password" && touched.confirm) {
      nextErr.confirm = validateField("confirm", next.confirm, next);
    }
    setForm(next);
    setErrors(nextErr);
  };
  const onBlur = (e) => {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, form[name], form) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");

    const nextErr = validateAll();
    setErrors(nextErr);
    if (Object.values(nextErr).some(Boolean)) return;

    try {
      const res = await axios.post(
        `${API_BASE}/api/users/signup`,
        {
          username: form.name,   // DTO: username/email/password
          email: form.email,
          password: form.password,
        },
        {
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          validateStatus: () => true,
        }
      );

      if (res.status === 200 || res.status === 201) {
        // 가입 후 로그인 화면으로
        navigate("/auth/login", { replace: true });
        return;
      }
      const msg =
        res.data?.message ||
        (res.status === 409 && "이미 사용 중인 이메일이에요.") ||
        (res.status === 400 && "요청 형식이 올바르지 않아요.") ||
        `회원가입 실패 (HTTP ${res.status})`;
      throw new Error(msg);
    } catch (err) {
      setServerError(err?.message || "회원가입에 실패했어요. 잠시 후 다시 시도해주세요.");
    }
  };

  const showError = (field) => (touched[field] || submitted) && errors[field];

  return (
    <div className="auth-wrap">
      <h1 className="auth-title">회원가입</h1>

      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <label>이름</label>
        <input
          name="name"
          placeholder="홍길동"
          value={form.name}
          onChange={onChange}
          onBlur={onBlur}
          className={showError("name") ? "input-error" : ""}
          required
        />
        {showError("name") && <p className="help-error">{errors.name}</p>}

        <label>이메일</label>
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={onChange}
          onBlur={onBlur}
          className={showError("email") ? "input-error" : ""}
          required
        />
        {showError("email") && <p className="help-error">{errors.email}</p>}

        <label>비밀번호</label>
        <input
          name="password"
          type="password"
          placeholder="4자 이상"
          value={form.password}
          onChange={onChange}
          onBlur={onBlur}
          className={showError("password") ? "input-error" : ""}
          required
        />
        {showError("password") && <p className="help-error">{errors.password}</p>}

        <label>비밀번호 확인</label>
        <input
          name="confirm"
          type="password"
          placeholder="다시 입력"
          value={form.confirm}
          onChange={onChange}
          onBlur={onBlur}
          className={showError("confirm") ? "input-error" : ""}
          required
        />
        {showError("confirm") && <p className="help-error">{errors.confirm}</p>}

        {serverError && <p className="help-error">{serverError}</p>}

        <button type="submit" className="btn-primary btn--block">가입하기</button>
      </form>

      <div className="auth-meta">
        <span>이미 계정이 있나요?</span>
        <Link to="/auth/login" className="link">로그인</Link>
      </div>
    </div>
  );
}
